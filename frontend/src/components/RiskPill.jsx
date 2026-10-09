import { AlertTriangle, ShieldCheck, AlertCircle } from "lucide-react";

const META = {
  High:   { cls: "high", icon: AlertTriangle, label: "High Risk" },
  Medium: { cls: "med",  icon: AlertCircle,   label: "Medium Risk" },
  Low:    { cls: "low",  icon: ShieldCheck,   label: "Low Risk" },
};

export function RiskPill({ risk, size = "md", testid, labelOverride }) {
  const m = META[risk] || META.Low;
  const Icon = m.icon;
  const sz = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-[11px] px-2.5 py-1";
  return (
    <span className={`risk-pill ${m.cls} ${sz}`} data-testid={testid}>
      <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {labelOverride || m.label}
    </span>
  );
}

export const RISK_COLOR = { High: "#EF4444", Medium: "#F59E0B", Low: "#10B981" };
