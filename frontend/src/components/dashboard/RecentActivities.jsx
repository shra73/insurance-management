import { useState, useEffect } from "react";

// No dedicated "recent activity" backend endpoint currently exists.
// This is a placeholder component with its own local loading state,
// ready to be wired to a real API (or composed from the existing
// Get-All Policies/Claims/Premiums endpoints) in a future step.
export default function RecentActivities() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="h-3 w-32 bg-gray-200 rounded mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-200"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                <div className="h-2.5 w-1/3 bg-gray-100 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Recent Activity</h3>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300 mb-2">
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="9" />
        </svg>
        <p className="text-sm text-gray-500">
          Activity feed isn't connected yet.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          This will show the latest policies, claims, and payments once available.
        </p>
      </div>
    </div>
  );
}