import { useEffect, useState } from "react";
import { decodeJwtPayload } from "../../utils/jwt";

export default function SessionInfoCard() {
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
    if (!token) return;

    const payload = decodeJwtPayload(token);
    if (!payload) return;

    setSessionInfo({
      issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      role: payload.role,
      rememberMe: !!localStorage.getItem("access_token")
    });
  }, []);

  if (!sessionInfo) return null;

  const now = new Date();
  const minutesRemaining = sessionInfo.expiresAt
    ? Math.max(0, Math.round((sessionInfo.expiresAt - now) / 60000))
    : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Session Information</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Session Started</dt>
          <dd className="font-medium text-gray-900">
            {sessionInfo.issuedAt ? sessionInfo.issuedAt.toLocaleString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Session Expires</dt>
          <dd className="font-medium text-gray-900">
            {sessionInfo.expiresAt ? sessionInfo.expiresAt.toLocaleString() : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Time Remaining</dt>
          <dd className="font-medium text-gray-900">
            {minutesRemaining !== null ? `${minutesRemaining} minutes` : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-gray-500">Remember Me</dt>
          <dd className="font-medium text-gray-900">
            {sessionInfo.rememberMe ? "Enabled" : "Disabled (session-only)"}
          </dd>
        </div>
      </dl>
      <p className="text-xs text-gray-400 mt-4">
        This information is read directly from your current login token, not
        from a backend session-tracking system (none exists yet).
      </p>
    </div>
  );
}