import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { WAKING_EVENT } from "@/lib/api";

export function WakingBanner() {
  const [state, setState] = useState({ waking: false, attempt: 0, max: 1 });

  useEffect(() => {
    const handler = (e) => setState({ waking: false, attempt: 0, max: 1, ...e.detail });
    window.addEventListener(WAKING_EVENT, handler);
    return () => window.removeEventListener(WAKING_EVENT, handler);
  }, []);

  if (!state.waking) return null;

  return (
    <div
      data-testid="waking-banner"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[min(92vw,520px)]"
    >
      <div
        className="cs-card flex items-center gap-3 p-3 pr-4"
        style={{ boxShadow: "0 10px 24px -8px rgba(15,23,42,0.15)" }}
      >
        <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 grid place-items-center shrink-0">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm text-slate-900 leading-tight">
            Waking up the server…
          </div>
          <div className="text-xs text-slate-500 leading-snug mt-0.5">
            Free-tier hosting sleeps when idle. First request can take up to a minute. Retrying automatically ({state.attempt}/{state.max}).
          </div>
        </div>
      </div>
    </div>
  );
}
