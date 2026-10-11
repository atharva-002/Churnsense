import { useRef, useState } from "react";
import { predictBatch, sampleCsvUrl } from "@/lib/api";
import { SectionHeader } from "@/components/SectionHeader";
import { ChartCard } from "@/components/ChartCard";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { RiskPill, RISK_COLOR } from "@/components/RiskPill";

const SUMMARY_CARDS = [
  { key: "rows", label: "Rows scored", color: "#4F46E5" },
  { key: "high_risk", label: "High risk", color: RISK_COLOR.High },
  { key: "medium_risk", label: "Medium risk", color: RISK_COLOR.Medium },
  { key: "low_risk", label: "Low risk", color: RISK_COLOR.Low },
];

export default function BatchPredict() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }
    setFile(f);
    setResult(null);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const onUpload = async () => {
    if (!file) {
      toast.error("Choose a CSV first.");
      return;
    }
    setLoading(true);
    try {
      const data = await predictBatch(file);
      setResult(data);
      toast.success(`Scored ${data.summary.rows} customers.`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || err.message || "Batch prediction failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!result) return;
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `churnsense_predictions_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10" data-testid="batch-page">
      <SectionHeader
        eyebrow="CSV in → predictions out"
        title="Batch Prediction"
        description="Upload a customer CSV (same columns as the Telco dataset, except Churn). Download the result with churn probabilities, risk levels, and the retain/churn label appended."
        testid="batch-header"
        right={
          <a
            href={sampleCsvUrl}
            data-testid="batch-sample-download"
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wide rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-colors text-slate-700 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download sample CSV
          </a>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="cs-card p-6 lg:col-span-2 flex flex-col" data-testid="batch-upload-card">
          <div className="overline-label mb-3">Step 1 · Upload</div>
          <label
            htmlFor="batch-file"
            onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`cs-dropzone cursor-pointer px-6 py-10 flex flex-col items-center justify-center text-center flex-1 ${dragging ? "is-dragging" : ""}`}
            data-testid="batch-dropzone"
          >
            <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center mb-4">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div className="font-[Manrope] font-semibold text-lg text-slate-900">
              {file ? file.name : "Drop a CSV here or click to browse"}
            </div>
            <div className="text-xs text-slate-500 mt-2 leading-relaxed max-w-xs">
              {file
                ? `${(file.size / 1024).toFixed(1)} KB · ready to score`
                : "Up to a few MB. Required columns match the Telco dataset. Need a template? Grab the sample CSV above."}
            </div>
          </label>
          <input
            id="batch-file"
            data-testid="batch-file-input"
            ref={inputRef}
            type="file"
            accept=".csv"
            className="cs-file"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          <div className="flex items-center gap-2 mt-4">
            <Button
              type="button"
              onClick={onUpload}
              disabled={!file || loading}
              data-testid="batch-submit-button"
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white h-11 font-semibold tracking-wide shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scoring batch…
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4 mr-2" /> Score Batch
                </>
              )}
            </Button>
            {file && (
              <Button
                type="button"
                onClick={clearFile}
                variant="outline"
                data-testid="batch-clear-button"
                className="rounded-lg border-slate-200 hover:bg-slate-50 h-11 w-11 p-0 text-slate-500"
                aria-label="Clear file"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3" data-testid="batch-summary">
                {SUMMARY_CARDS.map((kpi) => (
                  <div key={kpi.key} className="cs-card p-4">
                    <div className="overline-label">{kpi.label}</div>
                    <div
                      className="font-[Manrope] font-black text-2xl sm:text-3xl mt-3 tabular-nums"
                      style={{ color: kpi.color }}
                    >
                      {result.summary[kpi.key].toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <ChartCard
                title="Predictions preview"
                subtitle={`Showing first ${result.rows.length} of ${result.summary.rows} rows`}
                testid="batch-results-card"
                right={
                  <Button
                    type="button"
                    onClick={downloadCsv}
                    data-testid="batch-download-button"
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 text-xs font-semibold tracking-wide shadow-sm"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download CSV
                  </Button>
                }
              >
                <div className="cs-scroll overflow-auto max-h-[480px] rounded-lg border border-slate-200">
                  <table className="min-w-full text-sm" data-testid="batch-table">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                      <tr>
                        {Object.keys(result.rows[0] || {}).map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2.5 font-semibold text-[10px] uppercase tracking-[0.08em] text-slate-500 border-b border-slate-200 whitespace-nowrap"
                          >
                            {h.replace(/_/g, " ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((r, i) => (
                        <tr
                          key={i}
                          className={`border-b border-slate-100 last:border-b-0 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                          data-testid={`batch-row-${i}`}
                        >
                          {Object.entries(r).map(([k, v]) => (
                            <td key={k} className="px-3 py-2 font-mono text-xs whitespace-nowrap text-slate-700">
                              {k === "risk_level" ? (
                                <RiskPill risk={v} size="sm" labelOverride={v} />
                              ) : k === "prediction" ? (
                                <span
                                  className={`font-semibold ${v === "Churn" ? "text-red-500" : "text-emerald-600"}`}
                                >
                                  {v}
                                </span>
                              ) : (
                                String(v)
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ChartCard>
            </>
          ) : (
            <div
              className="cs-card p-10 flex flex-col items-center justify-center text-center h-full min-h-[400px]"
              data-testid="batch-empty"
            >
              <div className="w-14 h-14 rounded-xl bg-indigo-50 text-indigo-600 grid place-items-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="font-[Manrope] font-semibold text-xl tracking-tight text-slate-900">
                No batch scored yet
              </h3>
              <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">
                Upload a CSV with the Telco dataset columns and we'll return each customer's churn
                probability, a risk tier, and a downloadable CSV with everything appended.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
