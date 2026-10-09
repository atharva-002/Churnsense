/**
 * Human-friendly labels for one-hot features and numeric column names.
 * Covers the aggregated "No internet service" / "No phone service" rows too.
 */
export function prettyFeature(raw) {
  const map = {
    tenure: "Tenure (months)",
    MonthlyCharges: "Monthly charges ($)",
    TotalCharges: "Total charges ($)",
    SeniorCitizen: "Senior citizen",
    "No internet service": "No internet service",
    "No phone service": "No phone service",
  };
  if (map[raw]) return map[raw];
  if (!raw.includes("_")) return raw;

  const [col, val] = raw.split("_", 2);
  const colLabel = {
    Contract: "contract",
    InternetService: "internet",
    PaymentMethod: "payment via",
    OnlineSecurity: "online security",
    OnlineBackup: "online backup",
    DeviceProtection: "device protection",
    TechSupport: "tech support",
    StreamingTV: "streaming TV",
    StreamingMovies: "streaming movies",
    PaperlessBilling: "paperless billing",
    MultipleLines: "multiple lines",
    PhoneService: "phone service",
    Partner: "partner",
    Dependents: "dependents",
    gender: "gender",
  }[col];

  if (!colLabel) return raw;

  // Specific nicer phrasings
  const nicer = {
    "Contract_Month-to-month": "Month-to-month contract",
    "Contract_One year": "One-year contract",
    "Contract_Two year": "Two-year contract",
    "InternetService_Fiber optic": "Fiber-optic internet",
    "InternetService_DSL": "DSL internet",
    "InternetService_No": "No internet subscription",
    "PaymentMethod_Electronic check": "Pays by electronic check",
    "PaymentMethod_Mailed check": "Pays by mailed check",
    "PaymentMethod_Credit card (automatic)": "Auto-pay via credit card",
    "PaymentMethod_Bank transfer (automatic)": "Auto-pay via bank transfer",
    "PaperlessBilling_Yes": "Paperless billing",
    "PaperlessBilling_No": "Paper billing",
    "Partner_Yes": "Has a partner",
    "Partner_No": "No partner",
    "Dependents_Yes": "Has dependents",
    "Dependents_No": "No dependents",
    "gender_Male": "Male",
    "gender_Female": "Female",
    "SeniorCitizen_1": "Senior citizen",
    "SeniorCitizen_0": "Not a senior citizen",
    "PhoneService_Yes": "Has phone service",
    "PhoneService_No": "No phone service",
  };
  if (nicer[raw]) return nicer[raw];

  // Generic "<ColLabel>: <val>"
  return `${colLabel.charAt(0).toUpperCase() + colLabel.slice(1)}: ${val}`;
}
