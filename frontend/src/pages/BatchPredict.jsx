import { useRef, useState } from "react";
import { predictBatch, sampleCsvUrl } from "@/lib/api";
import { SectionHeader } from "@/components/SectionHeader";
import { ChartCard } from "@/components/ChartCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, FileSpreadsheet, Loader2, UploadCloud, AlertTriangle, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const RISK_COLOR = {
  High: "#FF2A00",
  Medium: "#FF5E00",
  Low: "#046A38",
};
const RISK_ICON = { High: AlertTriangle, Medium: AlertCircle, Low: ShieldCheck };

export default function BatchPredict() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".csv")) {
      toast.error("Please upload a .csv file.");
      return;
    }
    setFile(f);
    setResult(null);
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" data-testid="batch-page">
      <SectionHeader
        eyebrow="CSV in → predictions out"
        title="Batch Prediction"
        description="Upload a customer CSV (same columns as the Telco dataset, except Churn). Download the result with churn probabilities, risk levels, and the retain/churn label appended."
        testid="batch-header"
        right={
          <a
            href={sampleCsvUrl}
            data-testid="batch-sample-download"
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wide border border-[#E5E5E5] bg-white hover:bg-[#F7F7F8] transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Download sample CSV
          </a>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div
          className="cs-card p-6 lg:col-span-2 flex flex-col"
          data-testid="batch-upload-card"
        >
          <div className="overline-label mb-3">Step 1 · Upload</div>
          <label
            htmlFor="batch-file"
            className="border border-dashed border-[#C0C0C8] bg-[#FAFAFB] hover:bg-[#F0F0F2] transition-colors cursor-pointer px-6 py-10 flex flex-col items-center justify-center text-center flex-1"
            data-testid="batch-dropzone"
          >
            <UploadCloud className="w-10 h-10 text-[#002FA7] mb-3" />
            <div className="font-[Manrope] font-semibold text-lg">
              {file ? file.name : "Click to choose a CSV"}
            </div>
            <div className="text-xs text-[#666] mt-2">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : "Up to a few MB. Required columns match the Telco dataset."}
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
          <Button
            type="button"
            onClick={onUpload}
            disabled={!file || loading}
            data-testid="batch-submit-button"
            className="rounded-none bg-[#111] hover:bg-[#002FA7] text-white h-11 mt-4 font-semibold tracking-wide transition-colors"
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
          <p className="text-xs text-[#666] mt-3 leading-relaxed">
            Tip: Not sure what columns to send? Grab the <b>sample CSV</b> (20 rows pulled from the
            dataset without the Churn label) and upload it as-is.
          </p>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          {result ? (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#E5E5E5] border border-[#E5E5E5]" data-testid="batch-summary">
                {[
                  { label: "Rows scored", value: result.summary.rows, color: "#111" },
                  { label: "High risk", value: result.summary.high_risk, color: RISK_COLOR.High },
                  { label: "Medium risk", value: result.summary.medium_risk, color: RISK_COLOR.Medium },
                  { label: "Low risk", value: result.summary.low_risk, color: RISK_COLOR.Low },
                ].map((kpi) => (
                  <div key={kpi.label} className="bg-white p-5">
                    <div className="overline-label">{kpi.label}</div>
                    <div
                      className="font-[Manrope] font-black text-3xl mt-3 tabular-nums"
                      style={{ color: kpi.color }}
                    >
                      {kpi.value.toLocaleString()}
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
                    className="rounded-none bg-[#046A38] hover:bg-[#035e32] text-white h-10 px-4 text-xs font-semibold tracking-wide"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download CSV
                  </Button>
                }
              >
                <div className="cs-scroll overflow-auto max-h-[480px] border border-[#E5E5E5]">
                  <table className="min-w-full text-sm" data-testid="batch-table">
                    <thead className="bg-[#F7F7F8] sticky top-0">
                      <tr>
                        {Object.keys(result.rows[0] || {}).map((h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 font-semibold text-[10px] uppercase tracking-[0.1em] text-[#666] border-b border-[#E5E5E5] whitespace-nowrap"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.rows.map((r, i) => {
                        const Icon = RISK_ICON[r.risk_level];
                        return (
                          <tr key={i} className="border-b border-[#F0F0F2]" data-testid={`batch-row-${i}`}>
                            {Object.entries(r).map(([k, v]) => (
                              <td key={k} className="px-3 py-2 font-mono text-xs whitespace-nowrap">
                                {k === "risk_level" ? (
                                  <Badge
                                    className="rounded-none text-white hover:text-white gap-1 px-2 py-0.5 text-[10px]"
                                    style={{ background: RISK_COLOR[v], borderColor: RISK_COLOR[v] }}
                                  >
                                    {Icon ? <Icon className="w-3 h-3" /> : null} {v}
                                  </Badge>
                                ) : (
                                  String(v)
                                )}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
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
              <div className="w-14 h-14 border border-[#E5E5E5] grid place-items-center mb-4">
                <FileSpreadsheet className="w-6 h-6 text-[#002FA7]" />
              </div>
              <h3 className="font-[Manrope] font-semibold text-xl tracking-tight">
                No batch scored yet
              </h3>
              <p className="text-sm text-[#666] mt-2 max-w-md leading-relaxed">
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
