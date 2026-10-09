"""
ChurnSense — Model Training Script
----------------------------------
Trains and compares three classifiers (Logistic Regression, Random Forest,
XGBoost) on the IBM Telco Customer Churn dataset. Saves:
  - best model (joblib)
  - preprocessing pipeline (joblib, bundled inside the model pipeline)
  - metrics & artifacts (json) that the FastAPI backend reads at startup

Run:  python -m backend.ml.train    (or)    python backend/ml/train.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    roc_curve,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier


# -------------------- paths --------------------
BACKEND_DIR = Path(__file__).resolve().parents[1]
DATA_PATH = BACKEND_DIR / "data" / "Telco-Customer-Churn.csv"
ARTIFACTS_DIR = BACKEND_DIR / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = ARTIFACTS_DIR / "best_model.joblib"
METRICS_PATH = ARTIFACTS_DIR / "metrics.json"
EDA_PATH = ARTIFACTS_DIR / "eda.json"
FEATURES_PATH = ARTIFACTS_DIR / "features.json"


# -------------------- feature config --------------------
TARGET = "Churn"
DROP_COLS = ["customerID"]

NUMERIC_COLS = ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"]
CATEGORICAL_COLS = [
    "gender", "Partner", "Dependents", "PhoneService", "MultipleLines",
    "InternetService", "OnlineSecurity", "OnlineBackup", "DeviceProtection",
    "TechSupport", "StreamingTV", "StreamingMovies", "Contract",
    "PaperlessBilling", "PaymentMethod",
]


def load_and_clean(path: Path) -> pd.DataFrame:
    """Load Telco CSV and clean it (TotalCharges to numeric, drop blanks)."""
    df = pd.read_csv(path)
    # TotalCharges has a few blank strings — coerce to numeric and drop NaN rows
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"], errors="coerce")
    df = df.dropna(subset=["TotalCharges"]).reset_index(drop=True)
    # Binary target
    df[TARGET] = (df[TARGET].astype(str).str.strip().str.lower() == "yes").astype(int)
    return df


def build_eda(df: pd.DataFrame) -> dict:
    """Compute aggregate stats used by the Overview dashboard."""
    total = int(len(df))
    churned = int(df[TARGET].sum())
    churn_rate = round(churned / total * 100, 2)

    def group_rate(col: str) -> list[dict]:
        g = df.groupby(col)[TARGET].agg(["count", "sum"]).reset_index()
        g["churn_rate"] = (g["sum"] / g["count"] * 100).round(2)
        return [
            {"label": str(r[col]), "customers": int(r["count"]),
             "churned": int(r["sum"]), "churn_rate": float(r["churn_rate"])}
            for _, r in g.iterrows()
        ]

    # tenure bands
    bins = [0, 12, 24, 48, 60, np.inf]
    labels = ["0-12", "13-24", "25-48", "49-60", "60+"]
    df_t = df.copy()
    df_t["tenure_band"] = pd.cut(df_t["tenure"], bins=bins, labels=labels, right=True, include_lowest=True)
    tenure_rows = (
        df_t.groupby("tenure_band", observed=True)[TARGET]
        .agg(["count", "sum"]).reset_index()
    )
    tenure_rows["churn_rate"] = (tenure_rows["sum"] / tenure_rows["count"] * 100).round(2)
    tenure_bands = [
        {"label": str(r["tenure_band"]), "customers": int(r["count"]),
         "churned": int(r["sum"]), "churn_rate": float(r["churn_rate"])}
        for _, r in tenure_rows.iterrows()
    ]

    # monthly charges histogram
    hist, edges = np.histogram(df["MonthlyCharges"], bins=10)
    charges_hist = [
        {"range": f"{round(edges[i], 0):.0f}-{round(edges[i+1], 0):.0f}",
         "customers": int(hist[i])}
        for i in range(len(hist))
    ]

    return {
        "total_customers": total,
        "churned_customers": churned,
        "retained_customers": total - churned,
        "churn_rate": churn_rate,
        "avg_tenure": round(float(df["tenure"].mean()), 2),
        "avg_monthly_charges": round(float(df["MonthlyCharges"].mean()), 2),
        "avg_total_charges": round(float(df["TotalCharges"].mean()), 2),
        "by_contract": group_rate("Contract"),
        "by_internet_service": group_rate("InternetService"),
        "by_payment_method": group_rate("PaymentMethod"),
        "by_tenure_band": tenure_bands,
        "monthly_charges_hist": charges_hist,
        "by_senior_citizen": group_rate("SeniorCitizen"),
    }


def build_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_COLS),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLS),
        ]
    )


def evaluate(model, X_test, y_test) -> dict:
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]
    cm = confusion_matrix(y_test, y_pred)
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    # downsample ROC points for the chart
    idx = np.linspace(0, len(fpr) - 1, num=min(80, len(fpr))).astype(int)
    return {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred)), 4),
        "recall": round(float(recall_score(y_test, y_pred)), 4),
        "f1": round(float(f1_score(y_test, y_pred)), 4),
        "roc_auc": round(float(roc_auc_score(y_test, y_proba)), 4),
        "confusion_matrix": cm.tolist(),
        "roc_curve": [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in idx],
    }


def feature_importance(pipeline: Pipeline, model_name: str) -> list[dict]:
    """Return top feature importances (descending). Works for tree & linear models."""
    pre: ColumnTransformer = pipeline.named_steps["pre"]
    clf = pipeline.named_steps["clf"]
    try:
        names = pre.get_feature_names_out().tolist()
    except Exception:
        names = NUMERIC_COLS + CATEGORICAL_COLS

    if hasattr(clf, "feature_importances_"):
        importances = clf.feature_importances_
    elif hasattr(clf, "coef_"):
        importances = np.abs(clf.coef_).ravel()
    else:
        return []

    pairs = list(zip(names, importances))
    pairs.sort(key=lambda x: x[1], reverse=True)
    # clean up names: strip prefixes "num__" / "cat__"
    cleaned = []
    for name, val in pairs[:15]:
        pretty = name.replace("num__", "").replace("cat__", "")
        cleaned.append({"feature": pretty, "importance": round(float(val), 4)})
    return cleaned


def main() -> None:
    print(f"[train] loading dataset from {DATA_PATH}")
    df = load_and_clean(DATA_PATH)
    print(f"[train] rows after cleaning: {len(df)}")

    # EDA stats for Overview page
    eda = build_eda(df)
    EDA_PATH.write_text(json.dumps(eda, indent=2))
    print(f"[train] wrote {EDA_PATH}")

    # features & target
    X = df[NUMERIC_COLS + CATEGORICAL_COLS]
    y = df[TARGET]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )

    # Save feature schema for the Predict form
    schema = {
        "numeric": NUMERIC_COLS,
        "categorical": {col: sorted(df[col].astype(str).unique().tolist()) for col in CATEGORICAL_COLS},
        "defaults": {
            **{col: round(float(df[col].median()), 2) for col in NUMERIC_COLS},
            **{col: df[col].mode().iloc[0] for col in CATEGORICAL_COLS},
        },
    }
    FEATURES_PATH.write_text(json.dumps(schema, indent=2))
    print(f"[train] wrote {FEATURES_PATH}")

    # candidate models (all with class imbalance handling)
    candidates: dict[str, object] = {
        "Logistic Regression": LogisticRegression(max_iter=2000, class_weight="balanced", solver="liblinear"),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, max_depth=12, min_samples_split=4,
            class_weight="balanced", random_state=42, n_jobs=-1,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=300, max_depth=5, learning_rate=0.05,
            subsample=0.9, colsample_bytree=0.9,
            scale_pos_weight=float((y_train == 0).sum() / (y_train == 1).sum()),
            eval_metric="logloss", random_state=42, n_jobs=-1,
        ),
    }

    results: list[dict] = []
    pipelines: dict[str, Pipeline] = {}

    for name, clf in candidates.items():
        print(f"[train] fitting {name}...")
        pipe = Pipeline([("pre", build_preprocessor()), ("clf", clf)])
        pipe.fit(X_train, y_train)
        metrics = evaluate(pipe, X_test, y_test)
        metrics["model"] = name
        metrics["feature_importance"] = feature_importance(pipe, name)
        results.append(metrics)
        pipelines[name] = pipe
        print(f"           acc={metrics['accuracy']} f1={metrics['f1']} auc={metrics['roc_auc']}")

    # Pick best model by ROC-AUC
    results.sort(key=lambda r: r["roc_auc"], reverse=True)
    best_name = results[0]["model"]
    best_pipe = pipelines[best_name]
    joblib.dump(best_pipe, MODEL_PATH)
    print(f"[train] best model: {best_name} -> saved to {MODEL_PATH}")

    out = {
        "best_model": best_name,
        "models": results,
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "class_balance": {
            "train_churn_rate": round(float(y_train.mean()) * 100, 2),
            "test_churn_rate": round(float(y_test.mean()) * 100, 2),
        },
    }
    METRICS_PATH.write_text(json.dumps(out, indent=2))
    print(f"[train] wrote {METRICS_PATH}")


if __name__ == "__main__":
    main()
