import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useClaim } from "../hooks/useClaims";
import { usePolicy } from "../hooks/usePolicy";
import { useUpdateClaim } from "../hooks/useClaimMutations";
import { useAuth } from "../hooks/useAuth";
import { editClaimSchema } from "../schemas/claimSchemas";
import ClaimStatusBadge from "../components/claims/ClaimStatusBadge";
import ClaimStatusTimeline from "../components/claims/ClaimStatusTimeline";
import ClaimDocuments from "../components/claims/ClaimDocuments";
import ClaimStatusActionModal from "../components/claims/ClaimStatusActionModal";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";

export default function ClaimDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: claim, isLoading, isError, refetch } = useClaim(id);
  const { data: policy } = usePolicy(claim?.policy_id);
  const updateMutation = useUpdateClaim();

  const canManageStatus = user?.role === "ADMIN" || user?.role === "AGENT";
  const canEdit = claim && ["PENDING", "UNDER_REVIEW"].includes(claim.status);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(editClaimSchema),
    values: claim
      ? {
          claim_amount: String(claim.claim_amount),
          claim_date: claim.claim_date,
          description: claim.description || ""
        }
      : undefined
  });

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Couldn't load this claim." onRetry={refetch} />;
  if (!claim) return null;

  const onSubmit = (data) => {
    updateMutation.mutate(
      { id: claim.id, payload: data },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link to="/claims" className="text-sm text-primary hover:underline">
          &larr; Back to Claims
        </Link>
        <div className="flex items-center justify-between mt-1">
          <h1 className="text-xl font-bold text-gray-900">{claim.claim_number}</h1>
          <ClaimStatusBadge status={claim.status} />
        </div>
      </div>

      {/* Claim Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">Claim Information</h3>
          <div className="flex gap-3">
            {canEdit && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs font-medium text-primary hover:underline"
              >
                Edit Details
              </button>
            )}
            {canManageStatus && (
              <button
                onClick={() => setIsStatusModalOpen(true)}
                className="text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light"
              >
                Update Status
              </button>
            )}
          </div>
        </div>

        {!isEditing ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Claim Amount</dt>
              <dd className="font-medium text-gray-900">₹{claim.claim_amount}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Incident Date</dt>
              <dd className="font-medium text-gray-900">{claim.claim_date}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Description</dt>
              <dd className="font-medium text-gray-900">{claim.description || "—"}</dd>
            </div>
          </dl>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claim Amount (₹)
              </label>
              <input
                type="text"
                {...register("claim_amount")}
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
                Description
              </label>
              <textarea
                rows={3}
                {...register("description")}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  reset();
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light disabled:opacity-60"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Policy Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Policy Information</h3>
        {policy ? (
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Policy Number</dt>
              <dd className="font-medium text-gray-900">
                <Link to={`/policies/${policy.id}`} className="text-primary hover:underline">
                  {policy.policy_number}
                </Link>
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Policy Type</dt>
              <dd className="font-medium text-gray-900">{policy.type}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-gray-500">Loading policy details...</p>
        )}
      </div>

      <ClaimStatusTimeline claim={claim} />

      <ClaimDocuments policyId={claim.policy_id} />

      <ClaimStatusActionModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        claim={claim}
      />
    </div>
  );
}