import { useState } from "react";
import { REPORT_TYPES } from "../services/reportService";
import { useDashboardSummary } from "../hooks/useDashboardData";
import ReportCard from "../components/reports/ReportCard";
import ReportFiltersPanel from "../components/reports/ReportFiltersPanel";
import KpiCard from "../components/dashboard/KpiCard";
import CardSkeleton from "../components/skeletons/CardSkeleton";
import ErrorState from "../components/ErrorState";
import MonthlyPremiumsChart from "../components/dashboard/MonthlyPremiumsChart";
import MonthlyClaimsChart from "../components/dashboard/MonthlyClaimsChart";
import PolicyStatusChart from "../components/dashboard/PolicyStatusChart";
import ClaimStatusChart from "../components/dashboard/ClaimStatusChart";

function formatCurrency(value) {
  const num = Number(value);
  return `\u20b9${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    policyType: "",
    claimStatus: "",
    paymentStatus: ""
  });

  const { data, isLoading, isError, refetch } = useDashboardSummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-sm text-gray-500">
          Download full reports and review key statistics
        </p>
      </div>

      {/* Summary Cards -- reuses the existing Dashboard summary endpoint */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState message="Couldn't load summary statistics." onRetry={refetch} />
      )}

      {data && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard label="Total Customers" value={data.customers.total_customers} />
          <KpiCard label="Total Policies" value={data.policies.total_policies} />
          <KpiCard label="Active Policies" value={data.policies.active_policies} accent="text-green-600" />
          <KpiCard label="Total Claims" value={data.claims.total_claims} />
          <KpiCard label="Pending Claims" value={data.claims.pending} accent="text-amber-600" />
          <KpiCard
            label="Premium Collected"
            value={formatCurrency(data.premiums.total_collected)}
            accent="text-primary"
          />
        </div>
      )}

      {/* Filters (context-only, see component note re: backend limitation) */}
      <ReportFiltersPanel filters={filters} onChange={setFilters} />

      {/* Charts -- reuses the existing Dashboard chart components */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Analytics</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MonthlyPremiumsChart />
          <MonthlyClaimsChart />
          <PolicyStatusChart />
          <ClaimStatusChart />
        </div>
      </div>

      {/* Downloadable Reports */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Downloadable Reports</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {REPORT_TYPES.map((report) => (
            <ReportCard key={report.key} report={report} />
          ))}
        </div>
      </div>
    </div>
  );
}