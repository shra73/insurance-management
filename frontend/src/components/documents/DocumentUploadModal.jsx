import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useUploadDocument } from "../../hooks/useDocumentMutations";
import PolicySelect from "../policies/PolicySelect";

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "doc", "docx"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // matches backend's 10 MB limit
const DOCUMENT_CATEGORIES = [
  "POLICY_DOCUMENT",
  "ID_PROOF",
  "INSURANCE_CERTIFICATE",
  "CLAIM_DOCUMENT",
  "OTHER"
];

export default function DocumentUploadModal({ isOpen, onClose }) {
  const uploadMutation = useUploadDocument();
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({ defaultValues: { policy_id: "", document_type: "POLICY_DOCUMENT" } });

  if (!isOpen) return null;

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setFileError("");
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFileError(`Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`);
      setSelectedFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError("File exceeds the maximum allowed size of 10 MB");
      setSelectedFile(null);
      e.target.value = "";
      return;
    }

    setFileError("");
    setSelectedFile(file);
  };

  const onSubmit = (data) => {
    if (!data.policy_id) {
      toast.error("Please select a policy");
      return;
    }
    if (!selectedFile) {
      setFileError("Please select a file to upload");
      return;
    }

    uploadMutation.mutate(
      { policyId: data.policy_id, documentType: data.document_type, file: selectedFile },
      { onSuccess: handleClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-5">Upload Document</h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <PolicySelect
            value={watch("policy_id")}
            onChange={(val) => setValue("policy_id", val)}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={watch("document_type")}
              onChange={(e) => setValue("document_type", e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 ${
                fileError ? "border-red-300" : "border-gray-300"
              }`}
            >
              {selectedFile ? (
                <p className="text-sm text-gray-700">{selectedFile.name}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Click to select a file (PDF, PNG, JPG, JPEG, DOC, DOCX — max 10 MB)
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
            {fileError && <p className="text-red-600 text-xs mt-1">{fileError}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light disabled:opacity-60"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}