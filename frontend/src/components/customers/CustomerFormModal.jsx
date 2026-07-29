import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../../schemas/customerSchemas";
import { useCreateCustomer, useUpdateCustomer } from "../../hooks/useCustomerMutations";

export default function CustomerFormModal({ isOpen, onClose, customer }) {
  const isEditMode = !!customer;
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { name: "", dob: "", phone: "", address: "", email: "" }
  });

  // Prefill the form when editing an existing customer.
  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        dob: customer.dob,
        phone: customer.phone,
        address: customer.address,
        email: customer.email
      });
    } else {
      reset({ name: "", dob: "", phone: "", address: "", email: "" });
    }
  }, [customer, reset]);

  if (!isOpen) return null;

  const onSubmit = (data) => {
    if (isEditMode) {
      updateMutation.mutate(
        { id: customer.id, payload: data },
        { onSuccess: onClose }
      );
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  const fields = [
    { name: "name", label: "Full Name", type: "text" },
    { name: "dob", label: "Date of Birth", type: "date" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "email" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-base font-semibold text-gray-900 mb-5">
          {isEditMode ? "Edit Customer" : "Add Customer"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type={field.type}
                {...register(field.name)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors[field.name] ? "border-red-400" : "border-gray-300"
                }`}
              />
              {errors[field.name] && (
                <p className="text-red-600 text-xs mt-1">{errors[field.name].message}</p>
              )}
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
              rows={2}
              {...register("address")}
              className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                errors.address ? "border-red-400" : "border-gray-300"
              }`}
            />
            {errors.address && (
              <p className="text-red-600 text-xs mt-1">{errors.address.message}</p>
            )}
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
              {isSaving ? "Saving..." : isEditMode ? "Save Changes" : "Add Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}