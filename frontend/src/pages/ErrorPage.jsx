import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function ErrorPage({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-slate-50">
      <div className="w-14 h-14 rounded-full bg-danger-50 flex items-center justify-center mb-4">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-danger-600" aria-hidden="true">
          <path d="M12 9v4m0 4h.01M10.29 3.86l-8.18 14A2 2 0 003.82 21h16.36a2 2 0 001.71-3.14l-8.18-14a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
      <p className="text-slate-500 mb-6 max-w-md">
        An unexpected error occurred. You can try again, or return to the home page.
      </p>
      {import.meta.env.DEV && error && (
        <pre className="text-xs text-left bg-slate-100 text-slate-600 p-4 rounded-lg max-w-lg overflow-auto mb-6">
          {error.message}
        </pre>
      )}
      <div className="flex gap-3">
        {resetErrorBoundary && (
          <Button variant="primary" onClick={resetErrorBoundary}>Try again</Button>
        )}
        <Link to="/">
          <Button variant="secondary">Go home</Button>
        </Link>
      </div>
    </div>
  );
}