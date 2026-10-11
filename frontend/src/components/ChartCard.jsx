export function ChartCard({ title, subtitle, children, right, testid, className = "", hoverable = true }) {
  return (
    <div
      className={`cs-card ${hoverable ? "cs-card--hover" : ""} p-5 sm:p-6 flex flex-col h-full ${className}`}
      data-testid={testid}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          {subtitle ? <div className="overline-label mb-1">{subtitle}</div> : null}
          <h3 className="font-[Manrope] font-semibold text-base sm:text-lg tracking-tight text-slate-900">
            {title}
          </h3>
        </div>
        {right}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
