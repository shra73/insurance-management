import { Link } from "react-router-dom";

export default function ErrorPage({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-red-600 mb-2">Something went wrong</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        An unexpected error occurred. Please try again, or return to the home page.
      </p>
      {import.meta.env.DEV && error && (
        <pre className="text-xs text-left bg-gray-100 p-4 rounded-lg max-w-lg overflow-auto mb-6">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        {resetErrorBoundary && (
          <button
            onClick={resetErrorBoundary}
            className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light"
          >
            Try Again
          </button>
        )}
        <Link
          to="/"
          className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}