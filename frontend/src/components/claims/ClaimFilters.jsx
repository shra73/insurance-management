const STATUS_OPTIONS = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SETTLED"];

export default function ClaimFilters({
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
        placeholder="Search by claim number or policy number..."
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
            {s.replaceAll("_", " ")}
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