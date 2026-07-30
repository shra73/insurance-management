import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { recordPaymentSchema } from "../../schemas/premiumSchemas";
import { useCreatePremiumPayment } from "../../hooks/usePremiumMutations";
import PolicySelect from "../policies/PolicySelect";

const STATUS_OPTIONS = ["PENDING", "PAID", "FAILED", "PARTIAL"];

export default function RecordPaymentModal({ isOpen, onClose, policyId, policyNumber }) {
  const mutation = useCreatePremiumPayment();

  // If launched without a fixed policyId (e.g. from the Premiums list
  // page), the user picks the policy here instead.
  const [selectedPolicyId, setSelectedPolicyId] = useState(policyId || "");
  const [policyError, setPolicyError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: { amount: "", payment_status: "PAID", payment_date: "", payment_reference: "" }
  });

  const currentStatus = watch("payment_status");

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    setSelectedPolicyId(policyId || "");
    setPolicyError("");
    onClose();
  };

  const onSubmit = (data) => {
    const effectivePolicyId = policyId || selectedPolicyId;

    if (!effectivePolicyId) {
      setPolicyError("Please select a policy");
      return;
    }
    setPolicyError("");

    const payload = {
      policy_id: effectivePolicyId,
      amount: data.amount,
      payment_status: data.payment_status,
      ...(data.payment_date ? { payment_date: data.payment_date } : {}),
      ...(data.payment_reference ? { payment_reference: data.payment_reference } : {})
    };

    mutation.mutate(payload, {
      onSuccess: handleClose
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-1">Record Premium Payment</h3>
        <p className="text-sm text-gray-500 mb-5">
          {policyId
            ? <>For policy <b>{policyNumber}</b>. </>
            : "Select a policy and enter the payment details. "}
          The backend will reject this if it exceeds the outstanding premium amount.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!policyId && (
            <PolicySelect
              value={selectedPolicyId}
              onChange={setSelectedPolicyId}
              error={policyError}
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₹)
            </label>
            <input
              type="text"
              {...register("amount")}
              placeholder="e.g. 20000.00"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.amount ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.amount && (
              <p className="text-red-600 text-xs mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              {...register("payment_status")}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {(currentStatus === "PAID" || currentStatus === "PARTIAL") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                {...register("payment_date")}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors.payment_date ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.payment_date && (
                <p className="text-red-600 text-xs mt-1">{errors.payment_date.message}</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Reference <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              {...register("payment_reference")}
              placeholder="e.g. transaction ID"
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light disabled:opacity-60"
            >
              {mutation.isPending ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}