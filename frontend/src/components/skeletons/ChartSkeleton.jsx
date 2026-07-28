export default function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-3 w-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-64 w-full bg-gray-100 rounded"></div>
    </div>
  );
}