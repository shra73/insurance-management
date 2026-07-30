import { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { useDocuments } from "../hooks/useDocuments";
import { useDeleteDocument } from "../hooks/useDocumentMutations";
import DocumentTable from "../components/documents/DocumentTable";
import DocumentFilters from "../components/documents/DocumentFilters";
import DocumentUploadModal from "../components/documents/DocumentUploadModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import ErrorState from "../components/ErrorState";

export default function DocumentsPage() {
  const { user } = useAuth();

  if (user?.role === "CUSTOMER") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Documents</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Document access isn't available to customer accounts yet. This requires
          linking your login to your customer profile, which hasn't been built on the
          backend yet. Please contact an administrator or agent for document requests.
        </p>
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [fileType, setFileType] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [deletingDoc, setDeletingDoc] = useState(null);

  const { data, isLoading, isError, refetch } = useDocuments({
    page,
    per_page: 10,
    search: search || undefined,
    document_type: category || undefined
  });
  const deleteMutation = useDeleteDocument();

  // File type filtered client-side (no backend param), then sorted --
  // both scoped to the current page only.
  const processedDocuments = useMemo(() => {
    if (!data?.documents) return [];
    let list = [...data.documents];

    if (fileType) {
      list = list.filter((d) => d.file_type?.toLowerCase() === fileType);
    }

    if (sort === "newest") list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") list.sort((a, b) => a.id - b.id);
    if (sort === "largest") list.sort((a, b) => b.file_size - a.file_size);
    if (sort === "smallest") list.sort((a, b) => a.file_size - b.file_size);

    return list;
  }, [data, fileType, sort]);

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deletingDoc.id, {
      onSuccess: () => setDeletingDoc(null),
      onError: () => setDeletingDoc(null)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500">Manage uploaded policy and claim documents</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
        >
          + Upload Document
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 pb-0">
          <DocumentFilters
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            fileType={fileType}
            onFileTypeChange={setFileType}
            category={category}
            onCategoryChange={(v) => {
              setCategory(v);
              setPage(1);
            }}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        {isLoading && <TableSkeleton rows={6} columns={9} />}

        {isError && (
          <div className="p-6">
            <ErrorState message="Couldn't load documents." onRetry={refetch} />
          </div>
        )}

        {!isLoading && !isError && processedDocuments.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-10">No documents found.</p>
        )}

        {!isLoading && !isError && processedDocuments.length > 0 && (
          <>
            <DocumentTable documents={processedDocuments} onDelete={setDeletingDoc} />
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <DocumentUploadModal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />

      <ConfirmModal
        isOpen={!!deletingDoc}
        title="Delete Document"
        message={`Are you sure you want to delete "${deletingDoc?.original_file_name}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingDoc(null)}
      />
    </div>
  );
}

