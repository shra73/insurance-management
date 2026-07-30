import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { policySchema } from "../../schemas/policySchemas";
import { useCreatePolicy, useUpdatePolicy } from "../../hooks/usePolicyMutations";
import CustomerSelect from "./CustomerSelect";

const STATUS_OPTIONS = ["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"];

export default function PolicyFormModal({ isOpen, onClose, policy }) {
  const isEditMode = !!policy;
  const createMutation = useCreatePolicy();
  const updateMutation = useUpdatePolicy();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(policySchema),
    defaultValues: {
      customer_id: "",
      policy_number: "",
      type: "",
      start_date: "",
      end_date: "",
      premium_amount: "",
      status: "ACTIVE"
    }
  });

  useEffect(() => {
    if (policy) {
      reset({
        customer_id: policy.customer_id,
        policy_number: policy.policy_number,
        type: policy.type,
        start_date: policy.start_date,
        end_date: policy.end_date,
        premium_amount: policy.premium_amount,
        status: policy.status
      });
    } else {
      reset({
        customer_id: "",
        policy_number: "",
        type: "",
        start_date: "",
        end_date: "",
        premium_amount: "",
        status: "ACTIVE"
      });
    }
  }, [policy, reset]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    const payload = { ...data, premium_amount: data.premium_amount };
    if (isEditMode) {
      updateMutation.mutate({ id: policy.id, payload }, { onSuccess: onClose });
    } else {
      createMutation.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900 mb-5">
          {isEditMode ? "Edit Policy" : "Create Policy"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <CustomerSelect
            value={watch("customer_id")}
            onChange={(val) => setValue("customer_id", val, { shouldValidate: true })}
            error={errors.customer_id}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Number
            </label>
            <input
              type="text"
              {...register("policy_number")}
              disabled={isEditMode}
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:bg-gray-100 ${
                errors.policy_number ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.policy_number && (
              <p className="text-red-600 text-xs mt-1">{errors.policy_number.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Policy Type
            </label>
            <input
              type="text"
              {...register("type")}
              placeholder="e.g. HEALTH, LIFE, MOTOR"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.type ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.type && (
              <p className="text-red-600 text-xs mt-1">{errors.type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                {...register("start_date")}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors.start_date ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.start_date && (
                <p className="text-red-600 text-xs mt-1">{errors.start_date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                {...register("end_date")}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors.end_date ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors.end_date && (
                <p className="text-red-600 text-xs mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Premium Amount (₹)
            </label>
            <input
              type="text"
              {...register("premium_amount")}
              placeholder="e.g. 25000.00"
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.premium_amount ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.premium_amount && (
              <p className="text-red-600 text-xs mt-1">{errors.premium_amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              {...register("status")}
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.status ? "border-red-400" : "border-gray-300"
              }`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light disabled:opacity-60"
            >
              {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Create Policy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}