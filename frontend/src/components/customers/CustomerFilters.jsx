export default function CustomerFilters({ search, onSearchChange, sort, onSortChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by name, email, or phone..."
        className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="alphabetical">Alphabetical (A–Z)</option>
      </select>
    </div>
  );
}