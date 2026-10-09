import { motion } from "framer-motion";

export function KpiCard({ label, value, hint, accent = "#111", testid, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="cs-card p-6 flex flex-col justify-between h-full"
      data-testid={testid}
    >
      <div className="overline-label">{label}</div>
      <div className="mt-6">
        <div
          className="text-4xl sm:text-5xl font-[Manrope] font-black tabular-nums leading-none"
          style={{ color: accent }}
        >
          {value}
        </div>
        {hint ? <div className="text-xs text-[#666] mt-3">{hint}</div> : null}
      </div>
    </motion.div>
  );
}
