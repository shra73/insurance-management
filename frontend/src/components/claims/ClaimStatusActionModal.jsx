import { useUpdateClaimStatus } from "../../hooks/useClaimMutations";

// Mirrors the backend's exact ALLOWED_TRANSITIONS state machine, so the
// UI only ever offers a legal next status -- avoids a guaranteed 409
// from picking an invalid transition.
const ALLOWED_TRANSITIONS = {
  PENDING: ["UNDER_REVIEW"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["SETTLED"],
  REJECTED: [],
  SETTLED: []
};

export default function ClaimStatusActionModal({ isOpen, onClose, claim }) {
  const mutation = useUpdateClaimStatus();

  if (!isOpen || !claim) return null;

  const nextStatuses = ALLOWED_TRANSITIONS[claim.status] || [];

  const handleUpdate = (newStatus) => {
    mutation.mutate({ id: claim.id, status: newStatus }, { onSuccess: onClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Update Claim Status</h3>
        <p className="text-sm text-gray-600 mb-5">
          Claim <b>{claim.claim_number}</b> is currently <b>{claim.status}</b>.
        </p>

        {nextStatuses.length === 0 ? (
          <p className="text-sm text-gray-500 mb-5">
            This claim is in a final state and cannot be transitioned further.
          </p>
        ) : (
          <div className="flex flex-col gap-2 mb-5">
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleUpdate(status)}
                disabled={mutation.isPending}
                className="px-4 py-2.5 text-sm font-medium text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60"
              >
                Move to <b>{status}</b>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}