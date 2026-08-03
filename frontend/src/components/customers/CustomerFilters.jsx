export default function CustomerFilters({ search, onSearchChange, sort, onSortChange }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email, or phone"
          aria-label="Search customers"
          className="form-input pl-10"
        />
      </div>
      <select
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        aria-label="Sort customers"
        className="form-input sm:w-44"
      >
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="alphabetical">Alphabetical (A–Z)</option>
      </select>
    </div>
  );
}