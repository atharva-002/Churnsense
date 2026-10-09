# ChurnSense — PRD

## Problem Statement
Portfolio-quality Customer Churn Prediction web app ("ChurnSense") for a data analyst / data science fresher's resume and GitHub, built on the IBM Telco Customer Churn dataset.

## Architecture
- **Backend (FastAPI, Python 3.11)**: Trains LogReg + Random Forest + XGBoost offline (`backend/ml/train.py`). Serves `/api/eda`, `/api/models`, `/api/features`, `/api/predict`, `/api/predict/batch`, `/api/predict/sample-csv`.
- **Frontend (React 19)**: 5 pages — Overview, Model Performance, Predict, Batch Predict, About. Shadcn/UI + Recharts, Swiss / high-contrast design, mobile friendly.
- **Dataset**: IBM Telco 7,043 rows → 7,032 after cleaning. Bundled at `backend/data/Telco-Customer-Churn.csv`.

## Model Results (hold-out test set)
| Model | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---|---|---|---|
| **Logistic Regression (winner)** | 0.7257 | 0.4954 | 0.7807 | 0.6069 | **0.8351** |
| XGBoost | 0.7477 | 0.5240 | 0.7407 | 0.6129 | 0.8278 |
| Random Forest | 0.7498 | 0.5280 | 0.7246 | 0.6115 | 0.8257 |

## What's implemented (2026-02)
- Clean, documented training script (train.py)
- EDA artifacts, metrics, feature schema, best model (joblib)
- All 5 pages with charts, tables, forms
- Batch CSV upload + results table + CSV download
- Sample CSV endpoint
- Plain-English drivers + retention suggestion on single predict
- Clean README.md with results table, insights, run instructions
- No Emergent branding anywhere; footer: "Built by Atharva Kshirsagar"

## Backlog
- P1: Jupyter EDA notebook export
- P1: Screenshot files for README
- P2: SHAP-based explanations
- P2: Dockerfile + GitHub Actions
