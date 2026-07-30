import { useRef } from "react";
import { toast } from "react-toastify";
import { useClaimDocuments, downloadDocument } from "../../hooks/useClaimDocuments";
import { useUploadClaimDocument } from "../../hooks/useClaimMutations";

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // matches backend's 10 MB limit

export default function ClaimDocuments({ policyId }) {
  const { data, isLoading, refetch } = useClaimDocuments(policyId);
  const uploadMutation = useUploadClaimDocument();
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      toast.error(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File exceeds the maximum allowed size of 10 MB");
      e.target.value = "";
      return;
    }

    uploadMutation.mutate(
      { policyId, file },
      {
        onSuccess: () => refetch(),
        onSettled: () => {
          e.target.value = "";
        }
      }
    );
  };

  const handleDownload = (doc) => {
    downloadDocument(doc.id, doc.original_file_name);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Attached Documents</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="text-xs font-medium bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light disabled:opacity-60"
        >
          {uploadMutation.isPending ? "Uploading..." : "+ Upload Document"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading documents...</p>}

      {!isLoading && data?.documents?.length === 0 && (
        <p className="text-sm text-gray-500">No documents uploaded for this claim yet.</p>
      )}

      {!isLoading && data?.documents?.length > 0 && (
        <ul className="space-y-2">
          {data.documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2"
            >
              <div>
                <p className="text-gray-800 font-medium">{doc.original_file_name}</p>
                <p className="text-xs text-gray-400">
                  {doc.file_type?.toUpperCase()} · {(doc.file_size / 1024).toFixed(0)} KB
                </p>
              </div>
              <button
                onClick={() => handleDownload(doc)}
                className="text-primary hover:underline text-xs font-medium"
              >
                Download
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}