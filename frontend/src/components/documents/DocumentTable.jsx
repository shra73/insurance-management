import { Link } from "react-router-dom";
import { RelatedPolicyCell, RelatedCustomerCell } from "./RelatedCells";
import { useAuth } from "../../hooks/useAuth";

function formatFileSize(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentTable({ documents, onDelete }) {
  const { user } = useAuth();
  const canDelete = user?.role === "ADMIN" || user?.role === "AGENT";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">File Name</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Policy</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Uploaded By</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">#{doc.id}</td>
              <td className="px-4 py-3">
                <Link to={`/documents/${doc.id}`} className="font-medium text-primary hover:underline">
                  {doc.original_file_name}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600 uppercase">{doc.file_type}</td>
              <td className="px-4 py-3 text-gray-600">{formatFileSize(doc.file_size)}</td>
              <td className="px-4 py-3">
                <RelatedPolicyCell policyId={doc.policy_id} />
              </td>
              <td className="px-4 py-3 text-gray-600">
                <RelatedCustomerCell policyId={doc.policy_id} />
              </td>
              <td className="px-4 py-3 text-gray-600">User #{doc.uploaded_by}</td>
              <td className="px-4 py-3 text-gray-600">
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3 text-xs font-medium">
                  <Link to={`/documents/${doc.id}`} className="text-primary hover:underline">
                    View
                  </Link>
                  {canDelete && (
                    <button onClick={() => onDelete(doc)} className="text-red-600 hover:underline">
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}