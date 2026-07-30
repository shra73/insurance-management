import { useEffect, useState } from "react";
import { fetchDocumentBlob, triggerDownload } from "../../services/documentService";

const PREVIEWABLE_IMAGE_TYPES = ["png", "jpg", "jpeg"];

export default function DocumentPreview({ document }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fileType = document.file_type?.toLowerCase();
  const isImage = PREVIEWABLE_IMAGE_TYPES.includes(fileType);
  const isPdf = fileType === "pdf";
  const canPreview = isImage || isPdf;

  useEffect(() => {
    if (!canPreview) {
      setIsLoading(false);
      return;
    }

    let currentUrl = null;
    setIsLoading(true);
    setError(false);

    fetchDocumentBlob(document.id)
      .then(({ blobUrl: url }) => {
        currentUrl = url;
        setBlobUrl(url);
      })
      .catch(() => setError(true))
      .finally(() => setIsLoading(false));

    // Revoke the object URL when this document changes/unmounts, to
    // avoid leaking memory across repeated previews.
    return () => {
      if (currentUrl) window.URL.revokeObjectURL(currentUrl);
    };
  }, [document.id, canPreview]);

  const handleDownload = () => {
    triggerDownload(document.id, document.original_file_name);
  };

  if (!canPreview) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500 mb-3">
          Preview isn't available for .{fileType} files.
        </p>
        <button
          onClick={handleDownload}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light"
        >
          Download to view
        </button>
      </div>
    );
  }

  if (isLoading) {
    return <div className="h-80 bg-gray-100 rounded-lg animate-pulse" />;
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-red-50 rounded-lg">
        <p className="text-sm text-red-600 mb-3">Couldn't load the preview.</p>
        <button
          onClick={handleDownload}
          className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light"
        >
          Download instead
        </button>
      </div>
    );
  }

  if (isImage) {
    return (
      <img
        src={blobUrl}
        alt={document.original_file_name}
        className="w-full max-h-[500px] object-contain rounded-lg border border-gray-200"
      />
    );
  }

  return (
    <iframe
      src={blobUrl}
      title={document.original_file_name}
      className="w-full h-[500px] rounded-lg border border-gray-200"
    />
  );
}