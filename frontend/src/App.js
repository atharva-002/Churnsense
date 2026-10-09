import "@/App.css";
import { BrowserRouter, Routes, Route, NavLink, Link } from "react-router-dom";
import { Activity, LineChart as LineIcon, Target, UploadCloud, Info, Github } from "lucide-react";
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

function Shell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F8] text-[#111]">
      <header
        data-testid="app-header"
        className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-[#E5E5E5]"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" data-testid="brand-link" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-[#111] text-white grid place-items-center font-black text-sm tracking-tight">
              CS
            </div>
            <div className="leading-none">
              <div className="font-[Manrope] font-black text-lg tracking-tight">ChurnSense</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#666] mt-1">
                Telco · Churn Analytics
              </div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ to, label, icon: Icon, end, testid }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                data-testid={testid}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors border ${
                    isActive
                      ? "bg-[#111] text-white border-[#111]"
                      : "bg-white text-[#111] border-[#E5E5E5] hover:bg-[#F0F0F2]"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <nav className="md:hidden border-t border-[#E5E5E5] bg-white overflow-x-auto">
          <div className="flex min-w-max">
            {NAV.map(({ to, label, icon: Icon, end, testid }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                data-testid={`${testid}-mobile`}
                className={({ isActive }) =>
                  `flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-medium border-r border-[#E5E5E5] last:border-r-0 ${
                    isActive ? "bg-[#111] text-white" : "text-[#111]"
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer
        data-testid="app-footer"
        className="border-t border-[#E5E5E5] bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-sm text-[#666]">
            Built by{" "}
            <span className="font-semibold text-[#111]" data-testid="footer-author">
              Atharva Kshirsagar
            </span>
          </p>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.2em] text-[#999]">
            <span>Portfolio · Data Science</span>
            <a
              href="https://github.com/"
              target="_blank"
              rel="noopener noreferrer"
              data-testid="footer-github"
              className="inline-flex items-center gap-1 hover:text-[#111] transition-colors"
            >
              <Github className="w-3.5 h-3.5" /> GitHub
            </a>
          </div>
        </div>
      </footer>
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
      <Toaster richColors position="top-right" />
    </BrowserRouter>
  );
}

export default App;
