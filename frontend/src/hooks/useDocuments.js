import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchDocuments, fetchDocumentById } from "../services/documentService";

export function useDocuments(params) {
  return useQuery({
    queryKey: ["documents", params],
    queryFn: () => fetchDocuments(params),
    placeholderData: keepPreviousData
  });
}

export function useDocument(id) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: () => fetchDocumentById(id),
    enabled: !!id
  });
}