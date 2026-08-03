export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" role="status" aria-label="Loading">
      <div className="w-8 h-8 border-[3px] border-primary-100 border-t-primary rounded-full animate-spin" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}