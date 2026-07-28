export default function ErrorState({ message, onRetry }) {
  return (
    <div className="bg-white rounded-xl border border-red-100 p-6 flex flex-col items-center text-center">
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-red-400 mb-2"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p className="text-sm text-gray-600 mb-3">
        {message || "Something went wrong while loading this data."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm bg-primary text-white px-4 py-1.5 rounded-lg hover:bg-primary-light transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}