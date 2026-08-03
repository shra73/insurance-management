import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-toastify";
import { editProfileSchema } from "../../schemas/profileSchemas";
import { updateProfileRequest } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";

export default function EditProfileForm({ user }) {
  const { login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: user?.name || "" }
  });

  const onSubmit = async (data) => {
    setIsSaving(true);
    try {
      const result = await updateProfileRequest(data.name);

      // Update the stored session so the Navbar/other pages reflect the
      // new name immediately, without requiring a fresh login. Reuses the
      // existing AuthContext.login() to rewrite the cached user, keeping
      // whatever storage (local/session) was already in use.
      const usingLocal = !!localStorage.getItem("access_token");
      const token =
        localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
      login(result.user, token, usingLocal);

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Edit Profile</h3>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Edit
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          You can update your full name. Email cannot be changed. Phone number
          isn't tracked by the system yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Edit Profile</h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            type="text"
            {...register("name")}
            className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              errors.name ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="text-red-600 text-xs mt-1">{errors.name.message}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              reset();
              setIsEditing(false);
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
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}