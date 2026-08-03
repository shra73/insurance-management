export default function CardSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-24 rounded mb-3" />
      <div className="skeleton h-7 w-20 rounded" />
    </div>
  );
}