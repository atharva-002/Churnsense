"""
ChurnSense FastAPI backend.
- Serves EDA stats, model comparison metrics, feature schema
- /api/predict        single-customer churn prediction (with plain-English drivers)
- /api/predict/batch  CSV batch prediction -> downloadable CSV with probabilities
"""

from __future__ import annotations

import io
import json
import logging
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from starlette.middleware.cors import CORSMiddleware


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

ARTIFACTS_DIR = ROOT_DIR / "ml" / "artifacts"
MODEL_PATH = ARTIFACTS_DIR / "best_model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
EDA_PATH = ARTIFACTS_DIR / "eda.json"
FEATURES_PATH = ARTIFACTS_DIR / "features.json"


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("churnsense")


if not MODEL_PATH.exists():
    raise RuntimeError(
        f"Model artifact missing at {MODEL_PATH}. Run `python backend/ml/train.py` first."
    )

MODEL = joblib.load(MODEL_PATH)
METRICS: dict[str, Any] = json.loads(METRICS_PATH.read_text())
EDA: dict[str, Any] = json.loads(EDA_PATH.read_text())
FEATURES: dict[str, Any] = json.loads(FEATURES_PATH.read_text())

NUMERIC_COLS: list[str] = FEATURES["numeric"]
CATEGORICAL_COLS: list[str] = list(FEATURES["categorical"].keys())
EXPECTED_COLS: list[str] = NUMERIC_COLS + CATEGORICAL_COLS

# Pre-compute importance lookup from best model's feature_importance (ordered desc)
_best_fi = next(
    (m["feature_importance"] for m in METRICS["models"] if m["model"] == METRICS["best_model"]),
    [],
)
IMPORTANCE_MAP: dict[str, float] = {row["feature"]: row["importance"] for row in _best_fi}
SIGNED_MAP: dict[str, float] = {row["feature"]: row.get("signed", row["importance"]) for row in _best_fi}

# Load the training stats once (used for z-scored driver explanations)
_df_stats = pd.read_csv(ROOT_DIR / "data" / "Telco-Customer-Churn.csv")
_df_stats["TotalCharges"] = pd.to_numeric(_df_stats["TotalCharges"], errors="coerce")
_df_stats = _df_stats.dropna(subset=["TotalCharges"])
NUMERIC_STATS = {
    col: {"mean": float(_df_stats[col].mean()), "std": float(_df_stats[col].std()) or 1.0}
    for col in NUMERIC_COLS
}


app = FastAPI(title="ChurnSense API", version="1.0.0")
api = APIRouter(prefix="/api")


class CustomerIn(BaseModel):
    gender: str | None = None
    SeniorCitizen: int | None = Field(default=None, ge=0, le=1)
    Partner: str | None = None
    Dependents: str | None = None
    tenure: float | None = Field(default=None, ge=0)
    PhoneService: str | None = None
    MultipleLines: str | None = None
    InternetService: str | None = None
    OnlineSecurity: str | None = None
    OnlineBackup: str | None = None
    DeviceProtection: str | None = None
    TechSupport: str | None = None
    StreamingTV: str | None = None
    StreamingMovies: str | None = None
    Contract: str | None = None
    PaperlessBilling: str | None = None
    PaymentMethod: str | None = None
    MonthlyCharges: float | None = Field(default=None, ge=0)
    TotalCharges: float | None = Field(default=None, ge=0)


def _fill_defaults(payload: dict[str, Any]) -> dict[str, Any]:
    defaults = FEATURES["defaults"]
    out: dict[str, Any] = {}
    for col in EXPECTED_COLS:
        val = payload.get(col)
        if val is None or (isinstance(val, float) and np.isnan(val)):
            val = defaults.get(col)
        out[col] = val
    return out


_PLAIN_ENGLISH: dict[str, str] = {
    "Contract_Month-to-month": "Customer is on a month-to-month contract — the single biggest churn driver.",
    "Contract_One year": "Customer is on a one-year contract (mild protective factor).",
    "Contract_Two year": "Two-year contracts dramatically reduce churn risk.",
    "tenure": "Short tenure sharply increases churn risk; loyalty grows with months-with-company.",
    "MonthlyCharges": "High monthly charges correlate with higher churn risk.",
    "TotalCharges": "Low total charges (new customers) tend to churn more often.",
    "InternetService_Fiber optic": "Fiber-optic internet users show noticeably higher churn.",
    "InternetService_DSL": "DSL customers churn less than fiber users.",
    "InternetService_No": "Customers without internet service rarely churn.",
    "PaymentMethod_Electronic check": "Electronic-check payers show the highest churn across methods.",
    "PaymentMethod_Mailed check": "Mailed-check payers show elevated churn.",
    "PaymentMethod_Credit card (automatic)": "Auto-pay via credit card is correlated with retention.",
    "PaymentMethod_Bank transfer (automatic)": "Auto-pay bank transfer is correlated with retention.",
    "OnlineSecurity_No": "No online security add-on → higher churn.",
    "TechSupport_No": "No tech-support add-on → higher churn.",
    "PaperlessBilling_Yes": "Paperless billing customers churn slightly more.",
    "SeniorCitizen": "Senior citizens show above-average churn rates.",
    "Dependents_No": "Customers with no dependents churn more.",
    "Partner_No": "Single customers (no partner) churn slightly more.",
}


def _suggest_action(risk: str, drivers: list[dict]) -> str:
    if risk == "Low":
        return "Keep engaged with periodic value-add emails and loyalty perks."
    top_names = {d["feature"] for d in drivers[:5]}
    if any("Contract_Month-to-month" in n for n in top_names):
        return (
            "Offer a 1- or 2-year contract with a 10–15% discount — contract length is the "
            "biggest churn lever in this dataset."
        )
    if any("InternetService_Fiber optic" in n for n in top_names):
        return "Proactively check fiber connection quality and offer a loyalty credit."
    if any("PaymentMethod_Electronic check" in n for n in top_names):
        return "Nudge the customer onto auto-pay (credit card or bank transfer) with a small incentive."
    if any("TechSupport_No" in n or "OnlineSecurity_No" in n for n in top_names):
        return "Bundle TechSupport + OnlineSecurity add-ons free for 3 months."
    return "Assign a retention specialist and offer a tailored discount within 48 hours."


def _explain(customer: dict[str, Any]) -> list[dict]:
    """Top drivers via importance * presence (categoricals) or importance * z-score (numerics).
    Uses signed coefficients (when available) to decide which direction is "pushes to churn".
    """
    drivers: list[dict] = []
    for feat_name, importance in IMPORTANCE_MAP.items():
        signed = SIGNED_MAP.get(feat_name, importance)
        contribution = 0.0
        if feat_name in NUMERIC_COLS:
            stats = NUMERIC_STATS[feat_name]
            z = (float(customer[feat_name]) - stats["mean"]) / stats["std"]
            # positive signed coef => higher value pushes to churn; negative => protective
            contribution = signed * z
        elif "_" in feat_name:
            col, val = feat_name.split("_", 1)
            if col in CATEGORICAL_COLS and str(customer.get(col)) == val:
                contribution = signed
        if contribution <= 0:
            continue
        drivers.append({
            "feature": feat_name,
            "contribution": round(float(contribution), 4),
            "explanation": _PLAIN_ENGLISH.get(feat_name, f"{feat_name} contributes to churn risk."),
        })

    drivers.sort(key=lambda d: d["contribution"], reverse=True)
    return drivers[:5]


def _risk_level(proba: float) -> str:
    if proba >= 0.65:
        return "High"
    if proba >= 0.35:
        return "Medium"
    return "Low"


@api.get("/")
async def root() -> dict:
    return {"app": "ChurnSense", "status": "ok", "best_model": METRICS["best_model"]}


@api.get("/eda")
async def get_eda() -> dict:
    return EDA


@api.get("/models")
async def get_models() -> dict:
    return METRICS


@api.get("/features")
async def get_features() -> dict:
    return FEATURES


@api.post("/predict")
async def predict(body: CustomerIn) -> dict:
    data = _fill_defaults(body.model_dump())
    df = pd.DataFrame([data])[EXPECTED_COLS]
    proba = float(MODEL.predict_proba(df)[0, 1])
    risk = _risk_level(proba)
    drivers = _explain(data)
    return {
        "churn_probability": round(proba, 4),
        "churn_percent": round(proba * 100, 2),
        "risk_level": risk,
        "prediction": "Churn" if proba >= 0.5 else "Retain",
        "drivers": drivers,
        "suggested_action": _suggest_action(risk, drivers),
        "model_used": METRICS["best_model"],
        "input": data,
    }


@api.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)) -> dict:
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Please upload a .csv file.")
    try:
        contents = await file.read()
        df_in = pd.read_csv(io.BytesIO(contents))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse CSV: {exc}") from exc

    if "TotalCharges" in df_in.columns:
        df_in["TotalCharges"] = pd.to_numeric(df_in["TotalCharges"], errors="coerce")

    id_col = "customerID" if "customerID" in df_in.columns else None

    missing = [c for c in EXPECTED_COLS if c not in df_in.columns]
    if missing:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required columns: {missing}. Expected: {EXPECTED_COLS}",
        )

    df_feat = df_in[EXPECTED_COLS].copy()
    for col in NUMERIC_COLS:
        df_feat[col] = pd.to_numeric(df_feat[col], errors="coerce").fillna(FEATURES["defaults"][col])
    for col in CATEGORICAL_COLS:
        df_feat[col] = df_feat[col].fillna(FEATURES["defaults"][col]).astype(str)

    probas = MODEL.predict_proba(df_feat)[:, 1]
    out = pd.DataFrame()
    if id_col:
        out[id_col] = df_in[id_col].astype(str)
    out["churn_probability"] = np.round(probas, 4)
    out["churn_percent"] = np.round(probas * 100, 2)
    out["risk_level"] = [_risk_level(float(p)) for p in probas]
    out["prediction"] = ["Churn" if p >= 0.5 else "Retain" for p in probas]

    summary = {
        "rows": int(len(out)),
        "high_risk": int((out["risk_level"] == "High").sum()),
        "medium_risk": int((out["risk_level"] == "Medium").sum()),
        "low_risk": int((out["risk_level"] == "Low").sum()),
        "avg_probability": round(float(out["churn_probability"].mean()), 4),
    }
    return {
        "summary": summary,
        "rows": out.head(500).to_dict(orient="records"),
        "csv": out.to_csv(index=False),
    }


@api.get("/predict/sample-csv")
async def sample_csv() -> StreamingResponse:
    sample = _df_stats.drop(columns=["Churn"], errors="ignore").sample(n=20, random_state=7)
    buf = io.StringIO()
    sample.to_csv(buf, index=False)
    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=churnsense_sample.csv"},
    )


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _on_startup() -> None:
    logger.info("ChurnSense ready — best model: %s", METRICS["best_model"])
