import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center bg-slate-50">
      <p className="text-primary font-semibold text-sm mb-2">404 error</p>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 mb-6 max-w-sm">
        The page you're looking for doesn't exist or may have moved.
      </p>
      <Link to="/">
        <Button variant="primary">Go to Dashboard</Button>
      </Link>
    </div>
  );
}