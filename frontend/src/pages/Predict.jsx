import { useEffect, useMemo, useState } from "react";
import { fetchFeatures, predict } from "@/lib/api";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AlertTriangle, Loader2, Sparkles, ShieldCheck, AlertCircle } from "lucide-react";

const NUMERIC_LABELS = {
  tenure: "Tenure (months)",
  MonthlyCharges: "Monthly Charges ($)",
  TotalCharges: "Total Charges ($)",
  SeniorCitizen: "Senior Citizen (0/1)",
};

const CAT_LABELS = {
  gender: "Gender",
  Partner: "Partner",
  Dependents: "Dependents",
  PhoneService: "Phone Service",
  MultipleLines: "Multiple Lines",
  InternetService: "Internet Service",
  OnlineSecurity: "Online Security",
  OnlineBackup: "Online Backup",
  DeviceProtection: "Device Protection",
  TechSupport: "Tech Support",
  StreamingTV: "Streaming TV",
  StreamingMovies: "Streaming Movies",
  Contract: "Contract",
  PaperlessBilling: "Paperless Billing",
  PaymentMethod: "Payment Method",
};

const RISK_META = {
  High: { color: "#FF2A00", icon: AlertTriangle, label: "High Risk" },
  Medium: { color: "#FF5E00", icon: AlertCircle, label: "Medium Risk" },
  Low: { color: "#046A38", icon: ShieldCheck, label: "Low Risk" },
};

export default function Predict() {
  const [schema, setSchema] = useState(null);
  const [form, setForm] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchFeatures()
      .then((s) => {
        setSchema(s);
        setForm({ ...s.defaults });
      })
      .catch((e) => toast.error(e.message || "Could not load form schema"));
  }, []);

  const risk = useMemo(() => (result ? RISK_META[result.risk_level] : null), [result]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      ["tenure", "MonthlyCharges", "TotalCharges", "SeniorCitizen"].forEach((k) => {
        if (payload[k] !== undefined && payload[k] !== null && payload[k] !== "") {
          payload[k] = Number(payload[k]);
        }
      });
      const data = await predict(payload);
      setResult(data);
      toast.success(`Prediction: ${data.prediction} · ${data.churn_percent}%`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const resetDefaults = () => {
    if (schema) setForm({ ...schema.defaults });
    setResult(null);
  };

  if (!schema)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-96" />
      </div>
    );

  const numericKeys = schema.numeric;
  const categoricalKeys = Object.keys(schema.categorical);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" data-testid="predict-page">
      <SectionHeader
        eyebrow="Single customer scoring"
        title="Predict Churn"
        description="Fill the customer profile below. Form is pre-filled with dataset-median defaults so you can experiment one knob at a time."
        testid="predict-header"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <form
          onSubmit={onSubmit}
          data-testid="predict-form"
          className="cs-card p-5 sm:p-6 lg:col-span-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {numericKeys.map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <Label htmlFor={`in-${k}`} className="text-xs text-[#666] uppercase tracking-[0.1em]">
                  {NUMERIC_LABELS[k] || k}
                </Label>
                <Input
                  id={`in-${k}`}
                  type="number"
                  step={k === "SeniorCitizen" ? "1" : "0.01"}
                  min={0}
                  data-testid={`input-${k}`}
                  value={form[k] ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                  className="rounded-none border-[#E5E5E5] focus-visible:ring-0 focus-visible:border-[#002FA7] font-mono"
                />
              </div>
            ))}
            {categoricalKeys.map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <Label className="text-xs text-[#666] uppercase tracking-[0.1em]">
                  {CAT_LABELS[k] || k}
                </Label>
                <Select
                  value={String(form[k] ?? "")}
                  onValueChange={(v) => setForm((f) => ({ ...f, [k]: v }))}
                >
                  <SelectTrigger
                    data-testid={`select-${k}`}
                    className="rounded-none border-[#E5E5E5] focus:ring-0 focus:border-[#002FA7]"
                  >
                    <SelectValue placeholder={`Select ${k}`} />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    {schema.categorical[k].map((opt) => (
                      <SelectItem key={opt} value={String(opt)} className="rounded-none">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 pt-5 border-t border-[#E5E5E5]">
            <Button
              type="submit"
              disabled={loading}
              data-testid="predict-submit-button"
              className="rounded-none bg-[#111] hover:bg-[#002FA7] text-white px-6 py-2.5 h-11 text-sm font-semibold tracking-wide transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" /> Predict Churn
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={resetDefaults}
              variant="outline"
              data-testid="predict-reset-button"
              className="rounded-none border-[#E5E5E5] hover:bg-[#F7F7F8] h-11"
            >
              Reset to Defaults
            </Button>
          </div>
        </form>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {result ? (
            <>
              <div className="cs-card p-6" data-testid="predict-result">
                <div className="overline-label">Churn Probability</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <div
                    className="font-[Manrope] font-black text-5xl tabular-nums leading-none"
                    style={{ color: risk?.color || "#111" }}
                    data-testid="predict-probability"
                  >
                    {result.churn_percent}%
                  </div>
                  <Badge
                    data-testid="predict-risk-badge"
                    className="rounded-none text-white hover:text-white px-2 py-1 text-xs"
                    style={{ background: risk?.color, borderColor: risk?.color }}
                  >
                    {risk?.label}
                  </Badge>
                </div>
                <Progress
                  value={result.churn_percent}
                  className="h-2 mt-4 rounded-none bg-[#F0F0F2]"
                />
                <div className="text-xs text-[#666] mt-3 font-mono">
                  Prediction: <span className="text-[#111] font-semibold">{result.prediction}</span> ·
                  Model: {result.model_used}
                </div>
              </div>

              <div className="cs-card p-6" data-testid="predict-drivers">
                <div className="overline-label mb-3">Top drivers</div>
                {result.drivers.length === 0 ? (
                  <p className="text-sm text-[#666]">No positive-contribution drivers for this profile.</p>
                ) : (
                  <ol className="space-y-3">
                    {result.drivers.map((d, i) => (
                      <li key={d.feature} className="flex gap-3" data-testid={`driver-${i}`}>
                        <div className="w-6 h-6 bg-[#111] text-white grid place-items-center font-mono text-xs shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-mono text-xs text-[#002FA7] break-all">{d.feature}</div>
                          <div className="text-sm leading-snug mt-0.5">{d.explanation}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="cs-card p-6 bg-[#111] text-white" data-testid="predict-action">
                <div className="overline-label text-white/60">Suggested retention action</div>
                <p className="font-[Manrope] font-semibold text-lg mt-2 leading-snug">
                  {result.suggested_action}
                </p>
              </div>
            </>
          ) : (
            <div
              className="cs-card p-8 flex flex-col items-center justify-center text-center h-full min-h-[360px]"
              data-testid="predict-empty"
            >
              <div className="w-14 h-14 border border-[#E5E5E5] grid place-items-center mb-4">
                <Sparkles className="w-6 h-6 text-[#002FA7]" />
              </div>
              <h3 className="font-[Manrope] font-semibold text-xl tracking-tight">
                Awaiting prediction
              </h3>
              <p className="text-sm text-[#666] mt-2 max-w-xs">
                Fill out the customer profile on the left and click <b>Predict Churn</b> to score them.
                You'll get a probability, risk level, top drivers in plain English, and a retention tip.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
