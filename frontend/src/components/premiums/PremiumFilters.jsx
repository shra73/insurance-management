// "Overdue" isn't a real backend status -- FAILED is used instead,
// labeled accurately.
const STATUS_OPTIONS = ["PAID", "PENDING", "PARTIAL", "FAILED"];

export default function PremiumFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  sort,
  onSortChange
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 mb-4">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by policy number or receipt reference..."
        className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">All Statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </option>
        ))}
      </select>

      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="highest_amount">Highest Amount</option>
        <option value="lowest_amount">Lowest Amount</option>
      </select>
    </div>
  );
}