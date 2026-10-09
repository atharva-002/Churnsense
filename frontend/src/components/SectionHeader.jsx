export function SectionHeader({ eyebrow, title, description, right, testid }) {
  return (
    <div
      data-testid={testid}
      className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6"
    >
      <div>
        {eyebrow ? <div className="overline-label mb-2">{eyebrow}</div> : null}
        <h1 className="font-[Manrope] font-black text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-none">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-[#666] leading-relaxed mt-3 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}
