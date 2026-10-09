import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchEDA } from "@/lib/api";
import { KpiCard } from "@/components/KpiCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ChartCard } from "@/components/ChartCard";
import { Skeleton } from "@/components/ui/skeleton";

const BRAND = "#002FA7";
const CHURN = "#FF2A00";
const RETAIN = "#046A38";
const PALETTE = ["#002FA7", "#FF2A00", "#FF5E00", "#046A38", "#333333", "#8B5CF6"];

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#fff",
      border: "1px solid #E5E5E5",
      borderRadius: 0,
      fontFamily: "JetBrains Mono",
      fontSize: 12,
    },
    labelStyle: { color: "#111", fontWeight: 600 },
  };
}

export default function Overview() {
  const [eda, setEda] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetchEDA().then(setEda).catch((e) => setErr(e.message || "Failed to load EDA"));
  }, []);

  if (err)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="cs-card p-6 text-sm text-[#FF2A00]">Error: {err}</div>
      </div>
    );

  if (!eda)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );

  const pieData = [
    { name: "Retained", value: eda.retained_customers, color: RETAIN },
    { name: "Churned", value: eda.churned_customers, color: CHURN },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10" data-testid="overview-page">
      <SectionHeader
        eyebrow="IBM Telco Customer Churn · 7,032 customers"
        title="Churn Overview Dashboard"
        description="Interactive EDA of the IBM Telco Customer Churn dataset — the baseline every retention program should start from. KPIs, segment breakdowns, and distribution snapshots in one view."
        testid="overview-header"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <KpiCard
          label="Total Customers"
          value={eda.total_customers.toLocaleString()}
          hint="After cleaning (dropped blank TotalCharges)"
          testid="kpi-total"
          delay={0}
        />
        <KpiCard
          label="Churn Rate"
          value={`${eda.churn_rate}%`}
          accent={CHURN}
          hint={`${eda.churned_customers.toLocaleString()} churned customers`}
          testid="kpi-churn"
          delay={0.05}
        />
        <KpiCard
          label="Avg Tenure"
          value={`${eda.avg_tenure}`}
          hint="Months with the company"
          testid="kpi-tenure"
          delay={0.1}
        />
        <KpiCard
          label="Avg Monthly"
          value={`$${eda.avg_monthly_charges}`}
          hint={`Avg lifetime: $${eda.avg_total_charges}`}
          testid="kpi-monthly"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <ChartCard
          title="Churn vs Retention"
          subtitle="Dataset split"
          testid="chart-split"
          className="lg:col-span-1"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                stroke="#fff"
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans" }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Churn by Contract"
          subtitle="Biggest lever"
          testid="chart-contract"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eda.by_contract}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="customers" name="Customers" fill={BRAND} />
              <Bar dataKey="churned" name="Churned" fill={CHURN} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Churn Rate by Tenure Band" subtitle="Loyalty effect" testid="chart-tenure">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eda.by_tenure_band}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <Tooltip {...tooltipStyle()} formatter={(v) => `${v}%`} />
              <Bar dataKey="churn_rate" fill={CHURN} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Charges Distribution" subtitle="How much they pay" testid="chart-charges">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eda.monthly_charges_hist}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <Tooltip {...tooltipStyle()} />
              <Bar dataKey="customers" fill={BRAND} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Churn Rate by Payment Method" subtitle="Billing behavior" testid="chart-payment">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eda.by_payment_method} layout="vertical" margin={{ left: 50 }}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" horizontal={false} />
              <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: "#666" }} axisLine={{ stroke: "#E5E5E5" }} />
              <YAxis dataKey="label" type="category" width={160} tick={{ fontSize: 11, fill: "#111" }} axisLine={{ stroke: "#E5E5E5" }} tickLine={false} />
              <Tooltip {...tooltipStyle()} formatter={(v) => `${v}%`} />
              <Bar dataKey="churn_rate" fill={CHURN} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Churn Rate by Internet Service" subtitle="Product mix" testid="chart-internet">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eda.by_internet_service}>
              <CartesianGrid stroke="#E5E5E5" strokeDasharray="2 2" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#666" }} tickLine={false} axisLine={{ stroke: "#E5E5E5" }} />
              <Tooltip {...tooltipStyle()} formatter={(v) => `${v}%`} />
              <Bar dataKey="churn_rate">
                {eda.by_internet_service.map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
