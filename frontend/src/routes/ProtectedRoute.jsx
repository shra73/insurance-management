import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import LoadingSpinner from "../components/LoadingSpinner";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Preserve where the user was trying to go, so after logging in
    // they can be sent back there instead of always landing on a
    // fixed default page.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}