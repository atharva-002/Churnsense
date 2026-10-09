import { motion } from "framer-motion";

export function KpiCard({ label, value, hint, icon: Icon, accent = "indigo", testid, delay = 0 }) {
  const accents = {
    indigo: { bg: "bg-indigo-50", fg: "text-indigo-600", bar: "#4F46E5" },
    red:    { bg: "bg-red-50",    fg: "text-red-500",    bar: "#EF4444" },
    emerald:{ bg: "bg-emerald-50",fg: "text-emerald-600",bar: "#10B981" },
    amber:  { bg: "bg-amber-50",  fg: "text-amber-600",  bar: "#F59E0B" },
    slate:  { bg: "bg-slate-100", fg: "text-slate-700",  bar: "#64748B" },
  };
  const a = accents[accent] || accents.indigo;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.16, 1, 0.3, 1] }}
      className="cs-card cs-card--hover p-5 flex flex-col h-full"
      data-testid={testid}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="overline-label">{label}</div>
        {Icon ? (
          <div className={`w-9 h-9 ${a.bg} ${a.fg} rounded-lg grid place-items-center shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        ) : null}
      </div>
      <div className="mt-5">
        <div className="font-[Manrope] font-black text-3xl sm:text-4xl tabular-nums leading-none text-slate-900">
          {value}
        </div>
        {hint ? (
          <div className="text-xs text-slate-500 mt-2 leading-relaxed">{hint}</div>
        ) : null}
      </div>
    </motion.div>
  );
}
