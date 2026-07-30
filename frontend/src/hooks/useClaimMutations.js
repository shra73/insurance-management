import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { createClaim, updateClaim, updateClaimStatus } from "../services/claimService";
import { uploadClaimDocument } from "./useClaimDocuments";

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClaim,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      toast.success("Claim filed successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to file claim");
    }
  });
}

export function useUpdateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateClaim(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["claim", variables.id] });
      toast.success("Claim updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to update claim");
    }
  });
}

export function useUpdateClaimStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updateClaimStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["claim", variables.id] });
      toast.success("Claim status updated");
    },
    onError: (error) => {
      // Includes the backend's specific "invalid transition" message
      toast.error(error.response?.data?.error || "Failed to update claim status");
    }
  });
}

export function useUploadClaimDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadClaimDocument,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["documents", "policy", variables.policyId, "CLAIM_DOCUMENT"]
      });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to upload document");
    }
  });
}