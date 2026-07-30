import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { claimSchema } from "../../schemas/claimSchemas";
import { useCreateClaim } from "../../hooks/useClaimMutations";
import PolicySelect from "../policies/PolicySelect";

export default function ClaimFormModal({ isOpen, onClose }) {
  const mutation = useCreateClaim();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(claimSchema),
    defaultValues: { policy_id: "", claim_number: "", claim_amount: "", claim_date: "", description: "" }
  });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = (data) => {
    mutation.mutate(data, { onSuccess: handleClose });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900 mb-1">File a Claim</h3>
        <p className="text-sm text-gray-500 mb-5">
          New claims are always filed with status PENDING.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PolicySelect
            value={watch("policy_id")}
            onChange={(val) => setValue("policy_id", val, { shouldValidate: true })}
            error={errors.policy_id?.message}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claim Number
            </label>
            <input
              type="text"
              {...register("claim_number")}
              placeholder="e.g. CLM-10001"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.claim_number ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.claim_number && (
              <p className="text-red-600 text-xs mt-1">{errors.claim_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Claim Amount (₹)
            </label>
            <input
              type="text"
              {...register("claim_amount")}
              placeholder="e.g. 25000.00"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.claim_amount ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.claim_amount && (
              <p className="text-red-600 text-xs mt-1">{errors.claim_amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Incident Date
            </label>
            <input
              type="date"
              {...register("claim_date")}
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.claim_date ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.claim_date && (
              <p className="text-red-600 text-xs mt-1">{errors.claim_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description / Reason <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              {...register("description")}
              placeholder="Describe the reason for this claim..."
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
              {mutation.isPending ? "Filing..." : "File Claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}