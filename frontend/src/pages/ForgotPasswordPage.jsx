import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { forgotPasswordSchema } from "../schemas/authSchemas";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });

  // UI only, per spec -- no backend password-reset endpoint exists yet.
  // This simply shows a confirmation state locally; wiring this up to a
  // real API call is left for a future step.
  const onSubmit = () => {
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <p className="text-sm text-gray-700">
          If an account exists with that email, password reset instructions
          will be sent shortly.
        </p>
        <Link to="/login" className="text-primary text-sm font-medium hover:underline">
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-gray-600">
        Enter your account email and we'll send you instructions to reset
        your password.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          {...register("email")}
          className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
            errors.email ? "border-red-400" : "border-gray-300"
          }`}
          placeholder="you@example.com"
        />
        {errors.email && (
          <p className="text-red-600 text-xs mt-1">{errors.email.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
      >
        Send Reset Instructions
      </button>

      <p className="text-center text-sm text-gray-600">
        <Link to="/login" className="text-primary font-medium hover:underline">
          Back to Sign In
        </Link>
      </p>
    </form>
  );
}