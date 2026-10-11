import { useEffect, useMemo, useState } from "react";
import { fetchFeatures, predict } from "@/lib/api";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, Sparkles, RotateCcw, Lightbulb } from "lucide-react";
import { RiskPill, RISK_COLOR } from "@/components/RiskPill";
import { prettyFeature } from "@/lib/labels";

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

// SVG gauge: semicircle progress ring
function Gauge({ percent, color, label }) {
  const size = 220;
  const stroke = 18;
  const r = (size - stroke) / 2;
  const circ = Math.PI * r; // half circle
  const clamped = Math.max(0, Math.min(100, percent));
  const dash = (clamped / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;
  return (
    <div className="relative w-full flex items-center justify-center" data-testid="predict-gauge">
      <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.75" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
        {/* track */}
        <path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* progress */}
        <path
          d={`M ${stroke / 2} ${cy} A ${r} ${r} 0 0 1 ${size - stroke / 2} ${cy}`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 500ms cubic-bezier(0.16,1,0.3,1)" }}
        />
      </svg>
      <div className="absolute inset-x-0 top-9 flex flex-col items-center">
        <div
          className="font-[Manrope] font-black text-5xl tabular-nums leading-none"
          style={{ color }}
          data-testid="predict-probability"
        >
          {clamped.toFixed(1)}
          <span className="text-2xl">%</span>
        </div>
        <div className="text-[11px] uppercase tracking-[0.14em] text-slate-500 mt-2">{label}</div>
      </div>
    </div>
  );
}

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

  const riskColor = useMemo(() => (result ? RISK_COLOR[result.risk_level] : "#64748B"), [result]);

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
        <Skeleton className="h-10 w-72 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <Skeleton className="h-[600px] rounded-xl lg:col-span-3" />
          <Skeleton className="h-[600px] rounded-xl lg:col-span-2" />
        </div>
      </div>
    );

  const numericKeys = schema.numeric;
  const categoricalKeys = Object.keys(schema.categorical);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10" data-testid="predict-page">
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
                <Label htmlFor={`in-${k}`} className="text-[11px] text-slate-500 uppercase tracking-[0.08em] font-semibold">
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
                  className="rounded-lg border-slate-200 focus-visible:ring-2 focus-visible:ring-indigo-200 focus-visible:border-indigo-400 font-mono"
                />
              </div>
            ))}
            {categoricalKeys.map((k) => (
              <div key={k} className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-slate-500 uppercase tracking-[0.08em] font-semibold">
                  {CAT_LABELS[k] || k}
                </Label>
                <Select
                  value={String(form[k] ?? "")}
                  onValueChange={(v) => setForm((f) => ({ ...f, [k]: v }))}
                >
                  <SelectTrigger
                    data-testid={`select-${k}`}
                    className="rounded-lg border-slate-200 focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                  >
                    <SelectValue placeholder={`Select ${k}`} />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {schema.categorical[k].map((opt) => (
                      <SelectItem key={opt} value={String(opt)} className="rounded-md">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-6 pt-5 border-t border-slate-100">
            <Button
              type="submit"
              disabled={loading}
              data-testid="predict-submit-button"
              className="rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 h-11 text-sm font-semibold tracking-wide shadow-sm transition-colors"
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
              className="rounded-lg border-slate-200 hover:bg-slate-50 h-11 text-slate-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" /> Reset to Defaults
            </Button>
          </div>
        </form>

        <div className="lg:col-span-2 flex flex-col gap-4">
          {result ? (
            <>
              <div className="cs-card p-6" data-testid="predict-result">
                <div className="flex items-center justify-between">
                  <div className="overline-label">Churn Probability</div>
                  <RiskPill risk={result.risk_level} testid="predict-risk-badge" />
                </div>
                <Gauge percent={result.churn_percent} color={riskColor} label={result.prediction} />
                <div className="text-[11px] text-slate-500 mt-3 font-mono text-center">
                  Model: <span className="text-slate-700 font-semibold">{result.model_used}</span>
                </div>
              </div>

              <div className="cs-card p-6" data-testid="predict-drivers">
                <div className="overline-label mb-4">Top drivers</div>
                {result.drivers.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No positive-contribution drivers for this profile — the customer looks safe on every lever we track.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {result.drivers.map((d, i) => (
                      <li
                        key={d.feature}
                        className="group rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-colors p-3 flex gap-3"
                        data-testid={`driver-${i}`}
                      >
                        <div className="w-7 h-7 rounded-full bg-indigo-600 text-white grid place-items-center font-mono text-xs shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-slate-900">
                            {prettyFeature(d.feature)}
                          </div>
                          <div className="text-xs text-slate-600 leading-snug mt-1">{d.explanation}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                className="rounded-xl p-6 text-white relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}
                data-testid="predict-action"
              >
                <div className="flex items-start gap-3 relative">
                  <div className="w-9 h-9 rounded-lg bg-white/15 grid place-items-center shrink-0">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.16em] text-white/70 font-semibold">
                      Suggested retention action
                    </div>
                    <p className="font-[Manrope] font-semibold text-lg mt-1.5 leading-snug">
                      {result.suggested_action}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              className="cs-card p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              data-testid="predict-empty"
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-[Manrope] font-semibold text-xl tracking-tight text-slate-900">
                Awaiting prediction
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
                Fill out the customer profile on the left and click <b>Predict Churn</b> to score them.
                You'll get a probability gauge, risk tier, top drivers in plain English, and a retention tip.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
