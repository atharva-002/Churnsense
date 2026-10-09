import { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { Activity, LineChart as LineIcon, Target, UploadCloud, Info, Menu, X } from "lucide-react";
import Overview from "@/pages/Overview";
import ModelPerformance from "@/pages/ModelPerformance";
import Predict from "@/pages/Predict";
import BatchPredict from "@/pages/BatchPredict";
import About from "@/pages/About";
import { Toaster } from "@/components/ui/sonner";

const NAV = [
  { to: "/", label: "Overview", icon: Activity, end: true, testid: "nav-overview" },
  { to: "/models", label: "Models", icon: LineIcon, testid: "nav-models" },
  { to: "/predict", label: "Predict", icon: Target, testid: "nav-predict" },
  { to: "/batch", label: "Batch", icon: UploadCloud, testid: "nav-batch" },
  { to: "/about", label: "About", icon: Info, testid: "nav-about" },
];

function Brand() {
  return (
    <Link to="/" data-testid="brand-link" className="flex items-center gap-2.5 group">
      <div
        className="w-9 h-9 grid place-items-center rounded-lg text-white font-black text-sm tracking-tight transition-transform group-hover:scale-105"
        style={{ background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" }}
      >
        CS
      </div>
      <div className="leading-tight">
        <div className="font-[Manrope] font-black text-base tracking-tight">ChurnSense</div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-slate-500 mt-0.5">
          Telco Churn Analytics
        </div>
      </div>
    </Link>
  );
}

function Shell({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col bg-[var(--cs-bg)] text-[var(--cs-text)]">
      <header
        data-testid="app-header"
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/85 border-b border-slate-200"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-6">
            <Brand />

            <nav className="hidden md:flex items-center gap-7">
              {NAV.map(({ to, label, icon: Icon, end, testid }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  data-testid={testid}
                  className={({ isActive }) => `cs-nav-item flex items-center gap-1.5 ${isActive ? "active" : ""}`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              data-testid="mobile-nav-toggle"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Toggle navigation"
              className="md:hidden w-10 h-10 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="md:hidden border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-1">
              {NAV.map(({ to, label, icon: Icon, end, testid }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  data-testid={`${testid}-mobile`}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-3 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50"
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <Toaster richColors position="top-right" />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Shell>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/models" element={<ModelPerformance />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="/batch" element={<BatchPredict />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </Shell>
    </BrowserRouter>
  );
}

export default App;
