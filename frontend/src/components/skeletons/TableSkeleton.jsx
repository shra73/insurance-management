export default function TableSkeleton({ rows = 5, columns = 6 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3.5 border-b border-gray-100">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-3 bg-gray-200 rounded flex-1"></div>
          ))}
        </div>
      ))}
    </div>
  );
}