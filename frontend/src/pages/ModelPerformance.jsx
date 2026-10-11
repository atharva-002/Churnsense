import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { Info } from "lucide-react";
import { fetchModels } from "@/lib/api";
import { SectionHeader } from "@/components/SectionHeader";
import { ChartCard } from "@/components/ChartCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { prettyFeature } from "@/lib/labels";

const MODEL_COLORS = {
  "Logistic Regression": "#4F46E5",
  "Random Forest": "#F59E0B",
  XGBoost: "#10B981",
  "Gradient Boosting": "#10B981",
};
const CHURN = "#EF4444";
const RETAIN = "#10B981";

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      boxShadow: "0 4px 10px -2px rgba(15,23,42,0.08)",
      fontFamily: "IBM Plex Sans",
      fontSize: 12,
      padding: "8px 12px",
    },
    labelStyle: { color: "#0F172A", fontWeight: 600, marginBottom: 4 },
  };
}

function ConfusionMatrix({ matrix }) {
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  const cells = [
    { label: "True Negative", v: matrix[0][0], hint: "Correctly kept", color: "text-slate-900", bg: "bg-slate-50" },
    { label: "False Positive", v: matrix[0][1], hint: "False alarm", color: "text-amber-700", bg: "bg-amber-50" },
    { label: "False Negative", v: matrix[1][0], hint: "Missed churner", color: "text-red-600", bg: "bg-red-50" },
    { label: "True Positive", v: matrix[1][1], hint: "Caught churner", color: "text-emerald-700", bg: "bg-emerald-50" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2" data-testid="confusion-matrix">
      {cells.map((c) => (
        <div key={c.label} className={`${c.bg} rounded-lg p-4 border border-slate-200/60`}>
          <div className="overline-label mb-2">{c.label}</div>
          <div className={`font-mono text-2xl font-bold tabular-nums ${c.color}`}>{c.v.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {c.hint} · {((c.v / total) * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ModelPerformance() {
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchModels()
      .then((d) => {
        setData(d);
        setSelected(d.best_model);
      })
      .catch((e) => setErr(e.message || "Failed to load"));
  }, []);

  const selectedModel = useMemo(
    () => (data ? data.models.find((m) => m.model === selected) || data.models[0] : null),
    [data, selected]
  );

  const rocData = useMemo(() => {
    if (!data) return [];
    const grid = Array.from({ length: 50 }).map((_, i) => ({ fpr: +(i / 49).toFixed(3) }));
    data.models.forEach((m) => {
      m.roc_curve.forEach((p) => {
        const bucket = grid.find((g) => Math.abs(g.fpr - p.fpr) < 0.025);
        if (bucket && (bucket[m.model] === undefined || bucket[m.model] < p.tpr)) {
          bucket[m.model] = p.tpr;
        }
      });
    });
    data.models.forEach((m) => {
      let last = 0;
      grid.forEach((g) => {
        if (g[m.model] === undefined) g[m.model] = last;
        else last = g[m.model];
      });
    });
    return grid;
  }, [data]);

  if (err)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="cs-card p-6 text-sm text-red-500">Error: {err}</div>
      </div>
    );
  if (!data || !selectedModel)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-10 w-80 rounded-lg" />
        <Skeleton className="h-56 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );

  // Build signed-and-labeled feature importance for selected model
  const isLinear = selectedModel.model === "Logistic Regression";
  const fiData = selectedModel.feature_importance
    .map((f) => {
      // For linear models, signed is a signed coef; for trees, importance (always positive)
      const signed = f.signed !== undefined ? f.signed : f.importance;
      return {
        feature: prettyFeature(f.feature),
        rawFeature: f.feature,
        value: Number(signed),
        abs: f.importance,
      };
    })
    .slice()
    .reverse(); // reverse so biggest-magnitude is at the top in a horizontal chart (yAxis reads bottom-up)

  const maxAbs = Math.max(...fiData.map((d) => Math.abs(d.value))) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10" data-testid="models-page">
      <SectionHeader
        eyebrow={`Train/Test split: ${data.n_train.toLocaleString()} / ${data.n_test.toLocaleString()}`}
        title="Model Performance"
        description="Three classifiers trained with class-imbalance weighting on the Telco churn task. Compared on accuracy, precision, recall, F1 and ROC-AUC — ranked by ROC-AUC (threshold-independent)."
        testid="models-header"
        right={
          <Badge
            data-testid="best-model-badge"
            className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 text-xs tracking-wide"
          >
            Best: {data.best_model}
          </Badge>
        }
      />

      <div className="cs-card overflow-hidden mb-5" data-testid="model-table-card">
        <div className="p-5 border-b border-slate-200">
          <div className="overline-label">Comparison table</div>
          <h3 className="font-[Manrope] font-semibold text-lg mt-1 text-slate-900">
            All three models on the hold-out test set
          </h3>
          <p className="text-xs text-slate-500 mt-1">Click any row to inspect its confusion matrix & feature importance.</p>
        </div>
        <div className="cs-scroll overflow-x-auto">
          <table className="min-w-full text-sm" data-testid="model-table">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Model", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-[11px] uppercase tracking-[0.08em] text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.models.map((m) => {
                const isBest = m.model === data.best_model;
                const active = selected === m.model;
                return (
                  <tr
                    key={m.model}
                    data-testid={`model-row-${m.model.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => setSelected(m.model)}
                    className={`border-b border-slate-100 last:border-b-0 cursor-pointer transition-colors ${
                      active ? "bg-indigo-50/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="px-4 py-3.5 font-semibold">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: MODEL_COLORS[m.model] || "#0F172A" }} />
                        <span className="text-slate-900">{m.model}</span>
                        {isBest && (
                          <span className="text-[10px] font-semibold tracking-wide px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            BEST
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-slate-700">{m.accuracy}</td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-slate-700">{m.precision}</td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-slate-700">{m.recall}</td>
                    <td className="px-4 py-3.5 font-mono tabular-nums text-slate-700">{m.f1}</td>
                    <td className="px-4 py-3.5 font-mono tabular-nums font-bold text-slate-900">{m.roc_auc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <ChartCard title="ROC Curves" subtitle="Threshold-independent" testid="chart-roc">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={rocData}>
              <CartesianGrid stroke="#F1F5F9" />
              <XAxis
                dataKey="fpr"
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={{ stroke: "#E5E7EB" }}
                tickLine={false}
                label={{ value: "False Positive Rate", position: "insideBottom", offset: -2, fontSize: 11, fill: "#64748B" }}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
                label={{ value: "TPR", angle: -90, position: "insideLeft", fontSize: 11, fill: "#64748B" }}
              />
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <ReferenceLine
                segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                stroke="#CBD5E1"
                strokeDasharray="4 4"
              />
              {data.models.map((m) => (
                <Line
                  key={m.model}
                  type="monotone"
                  dataKey={m.model}
                  name={`${m.model} (AUC ${m.roc_auc})`}
                  stroke={MODEL_COLORS[m.model] || "#0F172A"}
                  strokeWidth={2.4}
                  dot={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title={`Confusion Matrix — ${selectedModel.model}`}
          subtitle="Click any row above"
          testid="chart-cm"
        >
          <ConfusionMatrix matrix={selectedModel.confusion_matrix} />
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="overline-label">Precision</div>
              <div className="font-mono text-lg mt-1 font-semibold text-slate-900">{selectedModel.precision}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <div className="overline-label">Recall</div>
              <div className="font-mono text-lg mt-1 font-semibold text-slate-900">{selectedModel.recall}</div>
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title={`Top Features — ${selectedModel.model}`}
        subtitle={isLinear ? "Signed coefficients" : "Impurity-based importance"}
        testid="chart-featimp"
      >
        <div className="flex items-start gap-2 text-xs text-slate-500 mb-3 bg-indigo-50/50 border border-indigo-100 rounded-lg px-3 py-2">
          <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            {isLinear ? (
              <>
                Bars extending <span className="text-red-500 font-semibold">right</span> push customers toward churn.
                Bars extending <span className="text-emerald-600 font-semibold">left</span> protect against churn.
                Length = magnitude of the standardized coefficient.
              </>
            ) : (
              <>
                Tree-based feature importances are unsigned. Each bar's length shows how often that feature was useful for the splits.
              </>
            )}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={Math.max(300, fiData.length * 30)}>
          <BarChart data={fiData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <CartesianGrid stroke="#F1F5F9" horizontal={false} />
            <XAxis
              type="number"
              domain={isLinear ? [-maxAbs * 1.1, maxAbs * 1.1] : [0, maxAbs * 1.1]}
              tick={{ fontSize: 11, fill: "#64748B" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="feature"
              type="category"
              width={210}
              tick={{ fontSize: 11, fill: "#0F172A" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              {...tooltipStyle()}
              formatter={(v) => (isLinear ? `${v > 0 ? "+" : ""}${v}` : v)}
            />
            {isLinear && <ReferenceLine x={0} stroke="#CBD5E1" />}
            <Bar dataKey="value" radius={[4, 4, 4, 4]}>
              {fiData.map((d, i) => (
                <Cell
                  key={i}
                  fill={!isLinear ? MODEL_COLORS[selectedModel.model] : d.value > 0 ? CHURN : RETAIN}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
