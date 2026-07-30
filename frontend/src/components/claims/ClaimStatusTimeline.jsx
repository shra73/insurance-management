import ClaimStatusBadge from "./ClaimStatusBadge";

// No status-history endpoint exists on the backend -- only the current
// status is available. Per spec, this shows the current status plus a
// clearly labeled placeholder rather than fabricating history entries.
export default function ClaimStatusTimeline({ claim }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Status Timeline</h3>

      <div className="flex items-center gap-3 mb-4">
        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            Current Status: <ClaimStatusBadge status={claim.status} />
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Last updated: {claim.updated_at ? new Date(claim.updated_at).toLocaleString() : "—"}
          </p>
        </div>
      </div>

      <div className="border-t border-dashed border-gray-200 pt-3">
        <p className="text-xs text-gray-400">
          A full status change history isn't available yet — the backend currently
          tracks only the claim's current status. This timeline will show past
          transitions (e.g. PENDING → UNDER_REVIEW → APPROVED) once a history
          endpoint is added.
        </p>
      </div>
    </div>
  );
}