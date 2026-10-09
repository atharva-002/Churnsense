export function ChartCard({ title, subtitle, children, right, testid, className = "" }) {
  return (
    <div className={`cs-card p-5 sm:p-6 flex flex-col h-full ${className}`} data-testid={testid}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          {subtitle ? <div className="overline-label mb-1">{subtitle}</div> : null}
          <h3 className="font-[Manrope] font-semibold text-lg sm:text-xl tracking-tight">
            {title}
          </h3>
        </div>
        {right}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
