import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { fetchModels } from "@/lib/api";
import { SectionHeader } from "@/components/SectionHeader";
import { ChartCard } from "@/components/ChartCard";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const MODEL_COLORS = {
  "Logistic Regression": "#002FA7",
  "Random Forest": "#FF5E00",
  XGBoost: "#046A38",
  "Gradient Boosting": "#046A38",
};

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#fff",
      border: "1px solid #E5E5E5",
      borderRadius: 0,
      fontFamily: "JetBrains Mono",
      fontSize: 12,
    },
  };
}

function ConfusionMatrix({ matrix }) {
  // matrix: [[TN, FP], [FN, TP]]
  const total = matrix.flat().reduce((a, b) => a + b, 0);
  const cells = [
    { label: "True Negative", v: matrix[0][0], hint: "Correctly kept" },
    { label: "False Positive", v: matrix[0][1], hint: "False alarm" },
    { label: "False Negative", v: matrix[1][0], hint: "Missed churner" },
    { label: "True Positive", v: matrix[1][1], hint: "Caught churner" },
  ];
  return (
    <div className="grid grid-cols-2 gap-px bg-[#E5E5E5] border border-[#E5E5E5]" data-testid="confusion-matrix">
      {cells.map((c, i) => (
        <div key={i} className="bg-white p-4">
          <div className="overline-label mb-2">{c.label}</div>
          <div className="font-mono text-3xl font-bold tabular-nums">{c.v.toLocaleString()}</div>
          <div className="text-xs text-[#666] mt-1">
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

  if (err)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="cs-card p-6 text-sm text-[#FF2A00]">Error: {err}</div>
      </div>
    );
  if (!data)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-64" />
      </div>
    );

  const rocData = (() => {
    // Merge FPR grid across models so lines align
    const grid = Array.from({ length: 50 }).map((_, i) => ({ fpr: +(i / 49).toFixed(3) }));
    data.models.forEach((m) => {
      m.roc_curve.forEach((p) => {
        const bucket = grid.find((g) => Math.abs(g.fpr - p.fpr) < 0.025);
        if (bucket && (bucket[m.model] === undefined || bucket[m.model] < p.tpr)) {
          bucket[m.model] = p.tpr;
        }
      });
    });
    // forward-fill
    data.models.forEach((m) => {
      let last = 0;
      grid.forEach((g) => {
        if (g[m.model] === undefined) g[m.model] = last;
        else last = g[m.model];
      });
    });
    return grid;
  })();

  const selectedModel = data.models.find((m) => m.model === selected) || data.models[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" data-testid="models-page">
      <SectionHeader
        eyebrow={`Train/Test split: ${data.n_train.toLocaleString()} / ${data.n_test.toLocaleString()}`}
        title="Model Performance"
        description="Three classifiers trained with class-imbalance weighting on the Telco churn task. Compared on accuracy, precision, recall, F1 and ROC-AUC — ranked by ROC-AUC (threshold-independent)."
        testid="models-header"
        right={
          <Badge
            data-testid="best-model-badge"
            className="bg-[#046A38] text-white hover:bg-[#046A38] rounded-none px-3 py-1.5 text-xs tracking-wide"
          >
            Best: {data.best_model}
          </Badge>
        }
      />

      <div className="cs-card overflow-hidden mb-6" data-testid="model-table-card">
        <div className="p-5 border-b border-[#E5E5E5]">
          <div className="overline-label">Comparison table</div>
          <h3 className="font-[Manrope] font-semibold text-lg mt-1">All three models on the hold-out test set</h3>
        </div>
        <div className="cs-scroll overflow-x-auto">
          <table className="min-w-full text-sm" data-testid="model-table">
            <thead className="bg-[#F7F7F8] border-b border-[#E5E5E5]">
              <tr>
                {["Model", "Accuracy", "Precision", "Recall", "F1", "ROC-AUC"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-[0.1em] text-[#666]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.models.map((m) => {
                const isBest = m.model === data.best_model;
                return (
                  <tr
                    key={m.model}
                    data-testid={`model-row-${m.model.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => setSelected(m.model)}
                    className={`border-b border-[#E5E5E5] cursor-pointer transition-colors ${
                      selected === m.model ? "bg-[#F0F0F2]" : "hover:bg-[#F7F7F8]"
                    }`}
                  >
                    <td className="px-4 py-3 font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 inline-block" style={{ background: MODEL_COLORS[m.model] || "#111" }} />
                        {m.model}
                        {isBest && (
                          <Badge className="bg-[#046A38] text-white hover:bg-[#046A38] rounded-none text-[10px] px-1.5 py-0">
                            BEST
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono tabular-nums">{m.accuracy}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{m.precision}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{m.recall}</td>
                    <td className="px-4 py-3 font-mono tabular-nums">{m.f1}</td>
                    <td className="px-4 py-3 font-mono tabular-nums font-bold">{m.roc_auc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="ROC Curves" subtitle="Threshold-independent" testid="chart-roc">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={rocData}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" />
              <XAxis
                dataKey="fpr"
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 11, fill: "#666" }}
                axisLine={{ stroke: "#E5E5E5" }}
                label={{ value: "False Positive Rate", position: "insideBottom", offset: -2, fontSize: 11, fill: "#666" }}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                tick={{ fontSize: 11, fill: "#666" }}
                axisLine={{ stroke: "#E5E5E5" }}
                label={{ value: "TPR", angle: -90, position: "insideLeft", fontSize: 11, fill: "#666" }}
              />
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {data.models.map((m) => (
                <Line
                  key={m.model}
                  type="monotone"
                  dataKey={m.model}
                  name={`${m.model} (AUC ${m.roc_auc})`}
                  stroke={MODEL_COLORS[m.model] || "#111"}
                  strokeWidth={2}
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
          <div className="grid grid-cols-2 gap-3 text-xs mt-4">
            <div className="cs-card p-3">
              <div className="overline-label">Precision</div>
              <div className="font-mono text-lg mt-1">{selectedModel.precision}</div>
            </div>
            <div className="cs-card p-3">
              <div className="overline-label">Recall</div>
              <div className="font-mono text-lg mt-1">{selectedModel.recall}</div>
            </div>
          </div>
        </ChartCard>
      </div>

      <ChartCard
        title={`Top Features — ${selectedModel.model}`}
        subtitle="Importance / |coefficient|"
        testid="chart-featimp"
      >
        <ResponsiveContainer width="100%" height={Math.max(260, selectedModel.feature_importance.length * 24)}>
          <BarChart data={selectedModel.feature_importance.slice().reverse()} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#666" }} axisLine={{ stroke: "#E5E5E5" }} />
            <YAxis
              dataKey="feature"
              type="category"
              width={200}
              tick={{ fontSize: 11, fill: "#111" }}
              tickLine={false}
              axisLine={{ stroke: "#E5E5E5" }}
            />
            <Tooltip {...tooltipStyle()} />
            <Bar dataKey="importance" fill={MODEL_COLORS[selectedModel.model] || "#111"} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
