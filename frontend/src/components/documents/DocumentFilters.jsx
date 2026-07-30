// File type filtered client-side (no backend param); Document Category
// uses the backend's real document_type param.
const FILE_TYPES = ["pdf", "jpg", "jpeg", "png", "docx"];
const DOCUMENT_CATEGORIES = [
  "POLICY_DOCUMENT",
  "ID_PROOF",
  "INSURANCE_CERTIFICATE",
  "CLAIM_DOCUMENT",
  "OTHER"
];

export default function DocumentFilters({
  search,
  onSearchChange,
  fileType,
  onFileTypeChange,
  category,
  onCategoryChange,
  sort,
  onSortChange
}) {
  return (
    <div className="flex flex-col lg:flex-row gap-3 mb-4">
      <input
        type="text"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search by file name..."
        className="flex-1 px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      />

      <select
        value={fileType}
        onChange={(e) => onFileTypeChange(e.target.value)}
        className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">All File Types</option>
        {FILE_TYPES.map((t) => (
          <option key={t} value={t}>
            {t.toUpperCase()}
          </option>
        ))}
      </select>

      <select
        value={category}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="">All Categories</option>
        {DOCUMENT_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c.replaceAll("_", " ")}
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
        <option value="largest">Largest</option>
        <option value="smallest">Smallest</option>
      </select>
    </div>
  );
}