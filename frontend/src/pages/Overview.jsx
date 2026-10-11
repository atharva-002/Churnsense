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
import { Users, TrendingDown, Clock, DollarSign } from "lucide-react";
import { fetchEDA } from "@/lib/api";
import { KpiCard } from "@/components/KpiCard";
import { SectionHeader } from "@/components/SectionHeader";
import { ChartCard } from "@/components/ChartCard";
import { Skeleton } from "@/components/ui/skeleton";

const PRIMARY = "#4F46E5";
const CHURN = "#EF4444";
const RETAIN = "#10B981";
const PALETTE = ["#4F46E5", "#EF4444", "#F59E0B", "#10B981", "#0EA5E9", "#8B5CF6"];

function tooltipStyle() {
  return {
    contentStyle: {
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      boxShadow: "0 4px 10px -2px rgba(15,23,42,0.08)",
      fontFamily: "IBM Plex Sans",
      fontSize: 12,
      padding: "8px 12px",
    },
    labelStyle: { color: "#0F172A", fontWeight: 600, marginBottom: 4 },
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
        <div className="cs-card p-6 text-sm text-red-500">Error: {err}</div>
      </div>
    );

  if (!eda)
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <Skeleton className="h-10 w-72 rounded-lg" />
        <Skeleton className="h-4 w-96 rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-80 rounded-xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
      </div>
    );

  const pieData = [
    { name: "Retained", value: eda.retained_customers, color: RETAIN },
    { name: "Churned", value: eda.churned_customers, color: CHURN },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10" data-testid="overview-page">
      <SectionHeader
        eyebrow={`IBM Telco Customer Churn · ${eda.total_customers.toLocaleString()} customers`}
        title="Churn Overview Dashboard"
        description="Interactive EDA of the IBM Telco Customer Churn dataset — the baseline every retention program should start from. KPIs, segment breakdowns, and distribution snapshots in one view."
        testid="overview-header"
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <KpiCard
          label="Total Customers"
          value={eda.total_customers.toLocaleString()}
          hint="After cleaning (dropped blank TotalCharges)"
          icon={Users}
          accent="indigo"
          testid="kpi-total"
          delay={0}
        />
        <KpiCard
          label="Churn Rate"
          value={`${eda.churn_rate}%`}
          accent="red"
          icon={TrendingDown}
          hint={`${eda.churned_customers.toLocaleString()} customers lost in the window`}
          testid="kpi-churn"
          delay={0.05}
        />
        <KpiCard
          label="Avg Tenure"
          value={`${eda.avg_tenure}`}
          hint="Months with the company · higher = stickier"
          icon={Clock}
          accent="emerald"
          testid="kpi-tenure"
          delay={0.1}
        />
        <KpiCard
          label="Avg Monthly"
          value={`$${eda.avg_monthly_charges}`}
          hint={`Lifetime avg: $${eda.avg_total_charges}`}
          icon={DollarSign}
          accent="amber"
          testid="kpi-monthly"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <ChartCard
          title="Churn vs Retention"
          subtitle="Dataset split"
          testid="chart-split"
          className="lg:col-span-1"
        >
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                innerRadius={60}
                outerRadius={88}
                paddingAngle={2}
                stroke="#fff"
                strokeWidth={2}
              >
                {pieData.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle()} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans", paddingTop: 6 }}
              />
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
            <BarChart data={eda.by_contract} barCategoryGap={28}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
              <Bar dataKey="customers" name="Customers" fill={PRIMARY} radius={[6, 6, 0, 0]} />
              <Bar dataKey="churned" name="Churned" fill={CHURN} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
        <ChartCard title="Churn Rate by Tenure Band" subtitle="Loyalty effect" testid="chart-tenure">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eda.by_tenure_band} barCategoryGap={22}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle()} formatter={(v) => `${v}%`} />
              <Bar dataKey="churn_rate" fill={CHURN} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Charges Distribution" subtitle="How much they pay" testid="chart-charges">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={eda.monthly_charges_hist} barCategoryGap={6}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle()} />
              <Bar dataKey="customers" fill={PRIMARY} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <ChartCard title="Churn Rate by Payment Method" subtitle="Billing behavior" testid="chart-payment">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eda.by_payment_method} layout="vertical" margin={{ left: 24 }} barCategoryGap={10}>
              <CartesianGrid stroke="#F1F5F9" horizontal={false} />
              <XAxis type="number" unit="%" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 11, fill: "#0F172A" }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle()} formatter={(v) => `${v}%`} />
              <Bar dataKey="churn_rate" fill={CHURN} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Churn Rate by Internet Service" subtitle="Product mix" testid="chart-internet">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={eda.by_internet_service} barCategoryGap={28}>
              <CartesianGrid stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={{ stroke: "#E5E7EB" }} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#64748B" }} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle()} formatter={(v) => `${v}%`} />
              <Bar dataKey="churn_rate" radius={[6, 6, 0, 0]}>
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
