import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { uploadDocument, deleteDocument } from "../services/documentService";

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to upload document");
    }
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || "Failed to delete document");
    }
  });
}