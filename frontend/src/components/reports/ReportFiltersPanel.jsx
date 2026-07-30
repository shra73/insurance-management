// These filters are NOT wired to the backend -- none of the report
// endpoints accept query parameters (confirmed from the actual route
// code). This panel is shown for context/future-readiness, with an
// explicit note, rather than silently pretending it narrows results.
const CLAIM_STATUSES = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SETTLED"];
const PAYMENT_STATUSES = ["PAID", "PENDING", "PARTIAL", "FAILED"];

export default function ReportFiltersPanel({ filters, onChange }) {
  const update = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
        <p className="text-xs text-amber-700">
          Report downloads currently include all records — the backend doesn't yet
          support filtering exports by these criteria. These filters are shown for
          reference and will apply once server-side filtering is added.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update("dateFrom", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update("dateTo", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Policy Type</label>
          <input
            type="text"
            value={filters.policyType}
            onChange={(e) => update("policyType", e.target.value)}
            placeholder="e.g. HEALTH"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Claim Status</label>
          <select
            value={filters.claimStatus}
            onChange={(e) => update("claimStatus", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Any</option>
            {CLAIM_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
          <select
            value={filters.paymentStatus}
            onChange={(e) => update("paymentStatus", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Any</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}