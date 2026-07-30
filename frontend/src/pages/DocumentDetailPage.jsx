import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useDocument } from "../hooks/useDocuments";
import { useDocumentRelated } from "../hooks/useDocumentRelated";
import { useDeleteDocument } from "../hooks/useDocumentMutations";
import { triggerDownload } from "../services/documentService";
import { useAuth } from "../hooks/useAuth";
import DocumentPreview from "../components/documents/DocumentPreview";
import ConfirmModal from "../components/ConfirmModal";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: document, isLoading, isError, refetch } = useDocument(id);
  const related = useDocumentRelated(document?.policy_id);
  const deleteMutation = useDeleteDocument();

  const canDelete = user?.role === "ADMIN" || user?.role === "AGENT";

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState message="Couldn't load this document." onRetry={refetch} />;
  if (!document) return null;

  const handleDownload = () => {
    triggerDownload(document.id, document.original_file_name);
  };

  const handleDelete = () => {
    deleteMutation.mutate(document.id, {
      onSuccess: () => navigate("/documents", { replace: true })
    });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to="/documents" className="text-sm text-primary hover:underline">
          &larr; Back to Documents
        </Link>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light"
          >
            Download
          </button>
          {canDelete && (
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <h1 className="text-xl font-bold text-gray-900">{document.original_file_name}</h1>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Preview</h3>
        <DocumentPreview document={document} />
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Document Details</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">File Type</dt>
            <dd className="font-medium text-gray-900 uppercase">{document.file_type}</dd>
          </div>
          <div>
            <dt className="text-gray-500">File Size</dt>
            <dd className="font-medium text-gray-900">{formatFileSize(document.file_size)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Category</dt>
            <dd className="font-medium text-gray-900">
              {document.document_type?.replaceAll("_", " ")}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Uploaded By</dt>
            <dd className="font-medium text-gray-900">User #{document.uploaded_by}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Upload Date</dt>
            <dd className="font-medium text-gray-900">
              {document.created_at ? new Date(document.created_at).toLocaleString() : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Related Policy</dt>
            <dd className="font-medium text-gray-900">
              <Link to={`/policies/${document.policy_id}`} className="text-primary hover:underline">
                {related.policyNumber || "Loading..."}
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Related Customer</dt>
            <dd className="font-medium text-gray-900">{related.customerName || "Loading..."}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Related Claim</dt>
            <dd className="font-medium text-gray-900">
              {document.document_type === "CLAIM_DOCUMENT" ? (
                <span className="text-gray-500 italic">
                  Categorized as a claim document, but not linked to a specific claim
                  (no such link exists in the backend yet)
                </span>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </div>

      <ConfirmModal
        isOpen={isDeleteOpen}
        title="Delete Document"
        message={`Are you sure you want to delete "${document.original_file_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}