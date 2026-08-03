import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema } from "../../schemas/customerSchemas";
import { useCreateCustomer, useUpdateCustomer } from "../../hooks/useCustomerMutations";
import Button from "../ui/Button";

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
      updateMutation.mutate({ id: customer.id, payload: data }, { onSuccess: onClose });
    } else {
      createMutation.mutate(data, { onSuccess: onClose });
    }
  };

  const fields = [
    { name: "name", label: "Full name", type: "text" },
    { name: "dob", label: "Date of birth", type: "date" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "email" }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="card shadow-modal w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
      >
        <h3 id="customer-modal-title" className="text-lg font-semibold text-slate-900 mb-5">
          {isEditMode ? "Edit customer" : "Add customer"}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="form-label">{field.label}</label>
              <input
                id={field.name}
                type={field.type}
                {...register(field.name)}
                aria-invalid={!!errors[field.name]}
                aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
                className={errors[field.name] ? "form-input-error" : "form-input"}
              />
              {errors[field.name] && (
                <p id={`${field.name}-error`} className="form-error-text">
                  {errors[field.name].message}
                </p>
              )}
            </div>
          ))}

          <div>
            <label htmlFor="address" className="form-label">Address</label>
            <textarea
              id="address"
              rows={2}
              {...register("address")}
              aria-invalid={!!errors.address}
              className={errors.address ? "form-input-error resize-none" : "form-input resize-none"}
            />
            {errors.address && <p className="form-error-text">{errors.address.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSaving}>
              {isEditMode ? "Save changes" : "Add customer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}