import { SectionHeader } from "@/components/SectionHeader";
import { Badge } from "@/components/ui/badge";
import { Github, Linkedin, Mail, ExternalLink } from "lucide-react";

const STACK = [
  "Python 3.11", "FastAPI", "scikit-learn", "XGBoost", "pandas", "numpy", "joblib",
  "React 19", "Tailwind CSS", "Shadcn/UI", "Recharts", "Framer Motion", "lucide-react",
];

const INSIGHTS = [
  {
    title: "Contract type is king",
    body:
      "Month-to-month customers churn at ~43%, one-year contracts at ~11%, two-year at just ~3%. Contract length is by far the strongest churn lever in the data.",
  },
  {
    title: "New customers churn hardest",
    body:
      "Customers in their first year of tenure churn at 2–3× the rate of long-tenured customers. The first 12 months are the risk window.",
  },
  {
    title: "Fiber is a double-edged sword",
    body:
      "Fiber-optic customers pay more but churn far more often than DSL users — a signal that service quality or pricing is driving dissatisfaction.",
  },
  {
    title: "Payment method predicts churn",
    body:
      "Electronic-check payers churn at ~45%, while auto-pay (credit card / bank transfer) customers churn at only ~15%. Nudge to auto-pay.",
  },
  {
    title: "Add-ons stick customers",
    body:
      "Customers without OnlineSecurity / TechSupport churn ~2× more than those with the add-ons. Bundling defensive services measurably reduces churn.",
  },
];

const PAGES = [
  { name: "Overview / EDA", desc: "KPI cards + 6 segment and distribution charts." },
  { name: "Model Performance", desc: "3-model comparison, ROC, confusion matrix, feature importance." },
  { name: "Predict", desc: "Single-customer form → probability, risk, plain-English drivers, retention tip." },
  { name: "Batch Predict", desc: "CSV upload → scored CSV download + risk summary." },
];

export default function About() {
  return (
    <div data-testid="about-page">
      <div
        className="relative border-b border-[#E5E5E5] overflow-hidden"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.86), rgba(255,255,255,0.98)), url('https://images.unsplash.com/photo-1644088379091-d574269d422f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA4Mzl8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGRhdGElMjB2aXN1YWxpemF0aW9uJTIwZ2VvbWV0cmljfGVufDB8fHx8MTc5MTU0MzYwM3ww&ixlib=rb-4.1.0&q=85')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="overline-label mb-4">Portfolio project · 2026</div>
          <h1 className="font-[Manrope] font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] max-w-3xl">
            ChurnSense — a full-stack look at customer churn.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[#333] max-w-2xl leading-relaxed">
            An end-to-end data science project built on the IBM Telco Customer Churn dataset:
            EDA, three competing classifiers, explainable predictions, and a batch scoring tool —
            all wrapped in a clean, high-contrast analytics UI.
          </p>
          <div className="flex flex-wrap gap-2 mt-8">
            {["Python", "FastAPI", "React", "scikit-learn", "XGBoost", "Recharts"].map((t) => (
              <Badge
                key={t}
                className="rounded-none bg-[#111] hover:bg-[#111] text-white px-3 py-1 text-xs tracking-wide"
              >
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <SectionHeader
          eyebrow="Project summary"
          title="What's inside"
          testid="about-section-summary"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          {PAGES.map((p) => (
            <div key={p.name} className="cs-card p-5">
              <div className="overline-label mb-2">Page</div>
              <h3 className="font-[Manrope] font-semibold text-lg">{p.name}</h3>
              <p className="text-sm text-[#666] mt-2 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>

        <SectionHeader
          eyebrow="Key business insights"
          title="What the data actually says"
          description="Findings surfaced by the EDA and feature-importance work — these are the levers a retention team should actually pull."
          testid="about-section-insights"
        />
        <div className="cs-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {INSIGHTS.map((ins, i) => (
            <div key={ins.title} className="cs-grid-item p-6" data-testid={`insight-${i}`}>
              <div className="overline-label mb-3">Insight {String(i + 1).padStart(2, "0")}</div>
              <h3 className="font-[Manrope] font-semibold text-lg leading-snug">{ins.title}</h3>
              <p className="text-sm text-[#666] mt-3 leading-relaxed">{ins.body}</p>
            </div>
          ))}
        </div>

        <SectionHeader eyebrow="Tech stack" title="Built with" testid="about-section-stack" />
        <div className="cs-card p-6 mb-12">
          <div className="flex flex-wrap gap-2">
            {STACK.map((t) => (
              <span
                key={t}
                className="font-mono text-xs px-3 py-1.5 border border-[#E5E5E5] bg-[#F7F7F8]"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <SectionHeader eyebrow="Author" title="Built by Atharva Kshirsagar" testid="about-section-author" />
        <div className="cs-card p-6 flex flex-col sm:flex-row items-start gap-6">
          <img
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzV8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBtYWxlJTIwaGVhZHNob3QlMjBwb3J0cmFpdHxlbnwwfHx8fDE3OTE1NDM2MDN8MA&ixlib=rb-4.1.0&q=85"
            alt="Atharva Kshirsagar"
            className="w-24 h-24 object-cover grayscale border border-[#E5E5E5]"
          />
          <div className="flex-1">
            <h3 className="font-[Manrope] font-bold text-xl">Atharva Kshirsagar</h3>
            <p className="text-sm text-[#666] mt-2 leading-relaxed max-w-2xl">
              Aspiring data analyst / data scientist. ChurnSense was built end-to-end — data
              cleaning, feature engineering, model comparison, explainability, and a production-grade
              web UI — to demonstrate the full pipeline on a classic business problem.
            </p>
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              <a
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="about-github-link"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] bg-white hover:bg-[#F7F7F8] transition-colors"
              >
                <Github className="w-3.5 h-3.5" /> GitHub <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="about-linkedin-link"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] bg-white hover:bg-[#F7F7F8] transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="mailto:hello@example.com"
                data-testid="about-email-link"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] bg-white hover:bg-[#F7F7F8] transition-colors"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
