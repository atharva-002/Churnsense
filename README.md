# ChurnSense — Customer Churn Prediction

> Predicting telecom customer churn end-to-end: EDA → modeling → explainable predictions → batch scoring, wrapped in a clean full-stack analytics app.

**Author:** Atharva Kshirsagar  
**Stack:** Python · FastAPI · scikit-learn · XGBoost · React · Tailwind · Recharts

---

## 1. Problem Statement

Customer churn — the rate at which customers leave a service — is one of the costliest problems in subscription businesses. Acquiring a new customer typically costs **5–7× more** than retaining an existing one.

**Goal:** build a model that, given a customer's profile and account details, predicts the probability that they will churn, and surfaces the **top reasons** so the business can take targeted retention action.

## 2. Dataset

**IBM Telco Customer Churn** — 7,043 customers × 21 columns.
- Source: [IBM GitHub](https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv)
- A copy is bundled at `backend/data/Telco-Customer-Churn.csv`.

Columns include demographics (gender, SeniorCitizen, Partner, Dependents), account info (tenure, Contract, PaperlessBilling, PaymentMethod), services (PhoneService, MultipleLines, InternetService, OnlineSecurity, OnlineBackup, DeviceProtection, TechSupport, StreamingTV, StreamingMovies), charges (MonthlyCharges, TotalCharges), and the target (Churn).

## 3. Approach

1. **Clean**: coerce `TotalCharges` to numeric and drop the 11 blank rows (final: 7,032 rows). Encode `Churn` to 0/1.
2. **Feature engineering**: One-hot encode 15 categorical columns, standard-scale 4 numeric columns.
3. **Stratified 80/20 train/test split** (random_state=42) to preserve the ~27% churn rate.
4. **Train three models** with class-imbalance handling:
   - Logistic Regression (`class_weight="balanced"`)
   - Random Forest (`class_weight="balanced"`, 300 trees, max_depth=12)
   - XGBoost (`scale_pos_weight` set to the inverse class ratio)
5. **Evaluate** on the hold-out set: accuracy, precision, recall, F1, ROC-AUC.
6. **Pick the best** by ROC-AUC (threshold-independent) and persist with `joblib`.
7. **Explain** single predictions by combining the model's feature-importance / coefficient magnitude with the customer's standardized values (positive one-hot presence for categoricals).

## 4. Results

Trained on 5,625 rows, evaluated on the 1,407-row hold-out:

| Model               | Accuracy | Precision | Recall | F1    | ROC-AUC |
|---------------------|---------:|----------:|-------:|------:|--------:|
| Logistic Regression |  0.7257  |  0.4954   | 0.7807 | 0.6069| **0.8351** |
| Random Forest       |  0.7498  |  0.5280   | 0.7246 | 0.6115| 0.8257  |
| XGBoost             |  0.7477  |  0.5240   | 0.7407 | 0.6129| 0.8278  |

> **Winner: Logistic Regression** (ROC-AUC 0.8351). The linear model is also the most interpretable, which is exactly what the retention team needs.

Reproduce with: `python backend/ml/train.py` — results are deterministic (`random_state=42`).

## 5. Key Insights

- **Contract length is the biggest churn lever.** Month-to-month customers churn at ~43%, one-year at ~11%, two-year at ~3%.
- **The first 12 months are the risk window.** New customers churn 2–3× more than long-tenured ones.
- **Fiber-optic customers churn more** than DSL customers despite paying more — a service-quality / pricing signal.
- **Payment method predicts churn.** Electronic-check payers churn at ~45%; auto-pay customers at ~15%.
- **Defensive add-ons stick customers.** No `OnlineSecurity` / `TechSupport` ≈ 2× churn vs. subscribers.

## 6. App Features

| Page              | What it does |
|-------------------|-------------|
| **Overview**      | 4 KPI cards + 6 charts: churn vs retain pie, churn by contract, tenure bands, monthly-charges histogram, churn by payment method, churn by internet service. |
| **Model Performance** | Side-by-side table of the three models, interactive ROC curves, confusion matrix for the selected model, feature importance chart. |
| **Predict**       | Form for one customer → churn %, risk badge (Low / Medium / High), top 5 drivers in plain English, and a suggested retention action. |
| **Batch Predict** | CSV upload → risk summary KPIs + table of churn probabilities + downloadable CSV. Includes a 20-row sample CSV. |
| **About**         | Project summary, tech stack, business insights, author links. |

## 7. Screenshots

*(Add screenshots of each page here — Overview, Model Performance, Predict, Batch Predict, About.)*

```
docs/
  overview.png
  models.png
  predict.png
  batch.png
  about.png
```

## 8. Tech Stack

**Backend**
- Python 3.11, FastAPI, Uvicorn
- scikit-learn, XGBoost, pandas, numpy, joblib

**Frontend**
- React 19, React Router, Tailwind CSS, Shadcn/UI
- Recharts (visualizations), Framer Motion, lucide-react, sonner

## 9. Project Structure

```
.
├── backend/
│   ├── data/Telco-Customer-Churn.csv       # bundled dataset
│   ├── ml/
│   │   ├── train.py                        # trainer: clean, train 3 models, pick best
│   │   └── artifacts/                      # best_model.joblib, metrics.json, eda.json, features.json
│   ├── server.py                           # FastAPI app with /api/* routes
│   ├── requirements.txt
│   └── .env
└── frontend/
    ├── src/
    │   ├── App.js                          # layout + routes
    │   ├── pages/
    │   │   ├── Overview.jsx
    │   │   ├── ModelPerformance.jsx
    │   │   ├── Predict.jsx
    │   │   ├── BatchPredict.jsx
    │   │   └── About.jsx
    │   ├── components/ (KpiCard, ChartCard, SectionHeader, ui/*)
    │   └── lib/api.js
    └── package.json
```

## 10. API

All routes are prefixed with `/api`:

| Method | Path                    | Purpose |
|--------|-------------------------|---------|
| GET    | `/api/`                 | Health check |
| GET    | `/api/eda`              | Aggregated EDA stats for the dashboard |
| GET    | `/api/models`           | Metrics for all three models + feature importance |
| GET    | `/api/features`         | Feature schema (categorical choices + numeric defaults) |
| POST   | `/api/predict`          | Single-customer prediction with drivers & suggested action |
| POST   | `/api/predict/batch`    | Multipart CSV upload → batch predictions |
| GET    | `/api/predict/sample-csv` | 20-row sample CSV for the batch page |

## 11. Run Locally

**Prereqs:** Python 3.11, Node 18+, Yarn.

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
# (optional) retrain the models:
#   pip install -r requirements-train.txt
#   python ml/train.py
uvicorn server:app --reload --port 8001

# 2. Frontend (in a second terminal)
cd frontend
yarn install
# edit frontend/.env (REACT_APP_BACKEND_URL=http://localhost:8001)
yarn start                      # → http://localhost:3000
```

## 12. Deploy for Free

ChurnSense is split into two zero-cost deployments: **FastAPI → Render** and **React → Vercel**.

### A. Backend on Render (free web service)

1. Push this repo to GitHub.
2. In the [Render dashboard](https://dashboard.render.com), click **New → Blueprint** and point it at your repo. Render will auto-detect [`render.yaml`](./render.yaml) and create a web service named `churnsense-api`.
   - If you prefer manual: **New → Web Service**, pick the repo, set **Root Directory** to `backend`, Runtime **Python 3**, Build `pip install -r requirements.txt`, Start `uvicorn server:app --host 0.0.0.0 --port $PORT`, Plan **Free**.
3. (Optional) In **Environment**, add `CORS_ORIGINS` set to your Vercel URL (e.g. `https://churnsense.vercel.app`). Default `*` works too.
4. Deploy. You'll get a URL like `https://churnsense-api.onrender.com`. Open `/api/` to confirm it returns `{"app":"ChurnSense","status":"ok",...}`.

> ⚠️ **Render free tier sleeps after 15 min of inactivity.** The first request after sleep takes ~30-50 seconds to wake. The frontend already handles this gracefully with a *"Waking up the server…"* banner and automatic retries.

### B. Frontend on Vercel

1. In the [Vercel dashboard](https://vercel.com/new), **Import** the same repo.
2. Set:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Create React App (auto-detected)
   - **Environment Variable**: `REACT_APP_BACKEND_URL` = your Render URL from step A (no trailing slash)
3. Deploy. [`frontend/vercel.json`](./frontend/vercel.json) rewrites every route to `/index.html` so client-side routing on `/predict`, `/models`, `/batch`, `/about` keeps working on hard-refresh.

### C. CORS

Once you have your Vercel URL, update `CORS_ORIGINS` on Render to lock down origins:

```
CORS_ORIGINS=https://churnsense.vercel.app,https://churnsense-git-main-<you>.vercel.app
```

Then redeploy the Render service.

## 13. Interview Pointers

- **Why Logistic Regression won** despite tree ensembles being popular: this dataset is small (~7k rows), the signal is largely linear in the standardized features, and class-weighted LR with a good preprocessor is a very strong baseline. The LR is also fully interpretable (we literally read coefficients).
- **Why class weighting over SMOTE**: faster, deterministic, no synthetic data to defend. Both approaches move the decision boundary in the same direction.
- **Why ROC-AUC as the tiebreaker**: churn is imbalanced (~27%), and the business cares about ranking at-risk customers to triage — ROC-AUC captures that.
- **Explainability**: for the chosen linear model, feature coefficients × standardized values give a per-customer, per-feature contribution that's trivial to translate into English.

## 14. Future Work

- Add SHAP values for a model-agnostic explainer.
- Hyperparameter search (Optuna) with cross-validation.
- A/B simulate retention actions and estimate uplift.
- Deploy as a Docker image; add CI with pytest.

---

Built by **Atharva Kshirsagar**.
