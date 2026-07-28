import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
      <p className="text-gray-600 mb-6">The page you're looking for doesn't exist.</p>
      <Link
        to="/"
        className="bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}