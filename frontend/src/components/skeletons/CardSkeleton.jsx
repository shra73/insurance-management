export default function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
      <div className="h-3 w-20 bg-gray-200 rounded mb-3"></div>
      <div className="h-7 w-24 bg-gray-300 rounded"></div>
    </div>
  );
}