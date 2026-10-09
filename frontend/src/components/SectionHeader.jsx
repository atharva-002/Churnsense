export function SectionHeader({ eyebrow, title, description, right, testid }) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 sm:mb-8"
    >
      <div className="min-w-0">
        {eyebrow ? <div className="overline-label mb-2.5">{eyebrow}</div> : null}
        <h1 className="font-[Manrope] font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.05] text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed mt-3 max-w-2xl">
            {description}
          </p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
