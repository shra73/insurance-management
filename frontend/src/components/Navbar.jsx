import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400"
          aria-label="Toggle navigation menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="font-semibold text-primary text-base md:text-lg">
          Insurance Management Platform
        </span>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            className="hidden sm:flex items-center gap-2.5 pr-3 pl-2 py-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <span className="w-7 h-7 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
              {initials || "U"}
            </span>
            <span className="text-sm text-slate-700">
              {user.name} <span className="text-slate-400">({user.role})</span>
            </span>
          </Link>
          <Button_Logout onClick={handleLogout} />
        </div>
      )}
    </header>
  );
}

// Kept inline to avoid an extra import cycle for this single, page-specific button.
function Button_Logout({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 px-3.5 py-1.5 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400"
    >
      Logout
    </button>
  );
}