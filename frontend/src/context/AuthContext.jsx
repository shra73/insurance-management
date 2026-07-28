import { createContext, useState, useEffect } from "react";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Auto-login: on first mount, check BOTH localStorage (persistent,
  // "remember me" sessions) and sessionStorage (cleared when the browser
  // tab closes, for sessions where "remember me" was left unchecked).
  useEffect(() => {
    const storedUser =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    const storedToken =
      localStorage.getItem("access_token") || sessionStorage.getItem("access_token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, accessToken, rememberMe) => {
    // "Remember Me" checked -> persist across browser restarts (localStorage).
    // Unchecked -> only last for this browser tab/session (sessionStorage).
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("access_token", accessToken);
    storage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}