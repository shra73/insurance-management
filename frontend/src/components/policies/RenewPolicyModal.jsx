import { useState } from "react";
import { useUpdatePolicy } from "../../hooks/usePolicyMutations";

// No dedicated "renew" backend endpoint exists -- this uses the standard
// PUT /api/policies/<id> update endpoint to extend the end_date, and is
// labeled honestly in the UI as doing exactly that.
export default function RenewPolicyModal({ isOpen, onClose, policy }) {
  const [newEndDate, setNewEndDate] = useState(policy?.end_date || "");
  const updateMutation = useUpdatePolicy();

  if (!isOpen) return null;

  const handleRenew = () => {
    updateMutation.mutate(
      { id: policy.id, payload: { end_date: newEndDate } },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Renew Policy</h3>
        <p className="text-sm text-gray-600 mb-4">
          Extend the end date for policy <b>{policy?.policy_number}</b>. This updates
          the policy's expiry date using the standard update endpoint.
        </p>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          New End Date
        </label>
        <input
          type="date"
          value={newEndDate}
          onChange={(e) => setNewEndDate(e.target.value)}
          min={policy?.start_date}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 mb-5"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleRenew}
            disabled={updateMutation.isPending || !newEndDate}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light disabled:opacity-60"
          >
            {updateMutation.isPending ? "Renewing..." : "Confirm Renewal"}
          </button>
        </div>
      </div>
    </div>
  );
}