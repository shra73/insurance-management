import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { changePasswordSchema } from "../../schemas/profileSchemas";
import { changePasswordRequest } from "../../services/authService";

export default function ChangePasswordForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: "", new_password: "", confirm_password: "" }
  });

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      await changePasswordRequest(data.current_password, data.new_password);
      toast.success("Password changed successfully");
      reset();
      setIsOpen(false);
    } catch (error) {
      const message = error.response?.data?.error || "Failed to change password";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Change Password</h3>
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Change Password</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Current Password
          </label>
          <input
            type="password"
            {...register("current_password")}
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              errors.current_password ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.current_password && (
            <p className="text-red-600 text-xs mt-1">{errors.current_password.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            type="password"
            {...register("new_password")}
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              errors.new_password ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.new_password && (
            <p className="text-red-600 text-xs mt-1">{errors.new_password.message}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            {...register("confirm_password")}
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              errors.confirm_password ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.confirm_password && (
            <p className="text-red-600 text-xs mt-1">{errors.confirm_password.message}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              setIsOpen(false);
            }}
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
            {isSaving ? "Changing..." : "Change Password"}
          </button>
        </div>
      </form>
    </div>
  );
}