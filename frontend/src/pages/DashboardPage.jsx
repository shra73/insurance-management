import KpiCard from "../components/dashboard/KpiCard";
import CardSkeleton from "../components/skeletons/CardSkeleton";
import ErrorState from "../components/ErrorState";
import MonthlyPremiumsChart from "../components/dashboard/MonthlyPremiumsChart";
import MonthlyClaimsChart from "../components/dashboard/MonthlyClaimsChart";
import PolicyStatusChart from "../components/dashboard/PolicyStatusChart";
import ClaimStatusChart from "../components/dashboard/ClaimStatusChart";
import RecentActivities from "../components/dashboard/RecentActivities";
import { useDashboardSummary } from "../hooks/useDashboardData";

function formatCurrency(value) {
  const num = Number(value);
  return `\u20b9${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useDashboardSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of your insurance operations</p>
      </div>

      {/* KPI Cards */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState message="Couldn't load dashboard summary." onRetry={refetch} />
      )}

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Customers" value={data.customers.total_customers} />
          <KpiCard label="Policies" value={data.policies.total_policies} />
          <KpiCard
            label="Premiums Collected"
            value={formatCurrency(data.premiums.total_collected)}
            accent="text-primary"
          />
          <KpiCard label="Claims" value={data.claims.total_claims} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MonthlyPremiumsChart />
        <MonthlyClaimsChart />
        <PolicyStatusChart />
        <ClaimStatusChart />
      </div>

      {/* Recent Activities */}
      <RecentActivities />
    </div>
  );
}