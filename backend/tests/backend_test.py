"""
ChurnSense backend API tests.
Covers: /api/, /api/eda, /api/models, /api/features, /api/predict,
/api/predict/batch, /api/predict/sample-csv.
"""
import io
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://churn-predictor-55.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    return s


# --- Root -----------------------------------------------------------------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    d = r.json()
    assert d.get("app") == "ChurnSense"
    assert d.get("status") == "ok"
    assert d.get("best_model") == "Logistic Regression"


# --- EDA ------------------------------------------------------------------
def test_eda(session):
    r = session.get(f"{API}/eda")
    assert r.status_code == 200
    d = r.json()
    assert d.get("total_customers") == 7032
    assert abs(d.get("churn_rate") - 26.58) < 0.5
    for key in ["by_contract", "by_internet_service", "by_payment_method", "by_tenure_band", "monthly_charges_hist"]:
        assert key in d, f"missing {key}"
        assert len(d[key]) > 0, f"{key} empty"


# --- Models ---------------------------------------------------------------
def test_models(session):
    r = session.get(f"{API}/models")
    assert r.status_code == 200
    d = r.json()
    assert d.get("best_model") == "Logistic Regression"
    assert len(d["models"]) == 3
    for m in d["models"]:
        for f in ["accuracy", "precision", "recall", "f1", "roc_auc", "confusion_matrix", "roc_curve", "feature_importance"]:
            assert f in m, f"{m.get('model')} missing {f}"


def test_models_feature_importance_signed_and_merged(session):
    """Iteration 2: feature_importance for Logistic Regression must
    (a) include a 'signed' field on each row and
    (b) have the 7 '<svc>_No internet service' dummies merged into at most one
        aggregated 'No internet service' entry."""
    r = session.get(f"{API}/models")
    assert r.status_code == 200
    d = r.json()
    lr = next((m for m in d["models"] if m["model"] == "Logistic Regression"), None)
    assert lr is not None
    fi = lr["feature_importance"]
    assert len(fi) > 0
    assert "signed" in fi[0], f"first FI row missing 'signed': {fi[0]}"
    # merged: no more than one row that *equals* 'No internet service' and
    # ZERO raw '<svc>_No internet service' leftovers
    raw_leftovers = [row["feature"] for row in fi if row["feature"].endswith("_No internet service")]
    assert raw_leftovers == [], f"unmerged dummies still present: {raw_leftovers}"
    aggregated = [row["feature"] for row in fi if row["feature"] == "No internet service"]
    assert len(aggregated) <= 1


# --- Features -------------------------------------------------------------
def test_features(session):
    r = session.get(f"{API}/features")
    assert r.status_code == 200
    d = r.json()
    assert len(d["numeric"]) == 4
    assert len(d["categorical"]) == 15
    assert len(d["defaults"]) == 19
    for col, opts in d["categorical"].items():
        assert isinstance(opts, list) and len(opts) > 0


# --- Predict --------------------------------------------------------------
def test_predict_high_risk(session):
    body = {
        "Contract": "Month-to-month",
        "tenure": 2,
        "MonthlyCharges": 95,
        "TotalCharges": 190,
        "InternetService": "Fiber optic",
        "PaymentMethod": "Electronic check",
    }
    r = session.post(f"{API}/predict", json=body)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["churn_percent"] > 50
    assert d["risk_level"] == "High"
    assert len(d["drivers"]) > 0
    assert d["suggested_action"]
    assert d["model_used"] == "Logistic Regression"


def test_predict_empty_body(session):
    r = session.post(f"{API}/predict", json={})
    assert r.status_code == 200
    d = r.json()
    assert "churn_probability" in d
    assert d["risk_level"] in ("Low", "Medium", "High")
    assert d["model_used"] == "Logistic Regression"


# --- Sample CSV -----------------------------------------------------------
def test_sample_csv(session):
    r = session.get(f"{API}/predict/sample-csv")
    assert r.status_code == 200
    assert "text/csv" in r.headers.get("content-type", "")
    lines = r.text.strip().split("\n")
    assert len(lines) == 21  # header + 20


# --- Batch predict --------------------------------------------------------
def test_predict_batch_valid(session):
    csv_r = session.get(f"{API}/predict/sample-csv")
    assert csv_r.status_code == 200
    files = {"file": ("sample.csv", csv_r.content, "text/csv")}
    r = session.post(f"{API}/predict/batch", files=files)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["summary"]["rows"] == 20
    assert len(d["rows"]) == 20
    for row in d["rows"]:
        assert "churn_probability" in row
        assert "risk_level" in row
        assert "prediction" in row
    assert "csv" in d and len(d["csv"]) > 0


def test_predict_batch_missing_cols(session):
    bad_csv = "foo,bar\n1,2\n"
    files = {"file": ("bad.csv", bad_csv.encode(), "text/csv")}
    r = session.post(f"{API}/predict/batch", files=files)
    assert r.status_code == 400
    detail = r.json().get("detail", "")
    assert "missing" in detail.lower() or "required" in detail.lower()
