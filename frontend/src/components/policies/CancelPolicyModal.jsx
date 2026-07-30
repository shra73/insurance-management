import { useUpdatePolicy } from "../../hooks/usePolicyMutations";

// No "reason" field exists on the backend Policy model, so none is
// rendered here -- it would have nowhere to be stored.
export default function CancelPolicyModal({ isOpen, onClose, policy }) {
  const updateMutation = useUpdatePolicy();

  if (!isOpen) return null;

  const handleCancel = () => {
    updateMutation.mutate(
      { id: policy.id, payload: { status: "CANCELLED" } },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Cancel Policy</h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to cancel policy <b>{policy?.policy_number}</b>? Its
          status will be set to <b>CANCELLED</b>. This action can be reversed later by
          editing the policy's status.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Keep Policy
          </button>
          <button
            onClick={handleCancel}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-60"
          >
            {updateMutation.isPending ? "Cancelling..." : "Cancel Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}