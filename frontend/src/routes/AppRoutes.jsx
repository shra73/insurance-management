import { Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import AuthLayout from "../layouts/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import NotFoundPage from "../pages/NotFoundPage";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public/auth routes: redirect to /dashboard if already logged in */}
      <Route
        element={
          <PublicRoute>
            <AuthLayout />
          </PublicRoute>
        }
      >
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Route>

      {/* Authenticated routes -- business pages (Dashboard, Customers,
          etc.) are intentionally NOT built in this step, per spec. */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        {/* <Route path="/customers" element={<CustomersPage />} /> */}
        {/* <Route path="/policies" element={<PoliciesPage />} /> */}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}