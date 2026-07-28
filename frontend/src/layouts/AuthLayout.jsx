import { Outlet } from "react-router-dom";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8">
        <h1 className="text-xl font-bold text-primary text-center mb-6">
          Insurance Management Platform
        </h1>
        <Outlet />
      </div>
    </div>
  );
}