import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useClaims } from "../hooks/useClaims";
import ClaimTable from "../components/claims/ClaimTable";
import ClaimFilters from "../components/claims/ClaimFilters";
import ClaimFormModal from "../components/claims/ClaimFormModal";
import ClaimStatusActionModal from "../components/claims/ClaimStatusActionModal";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import ErrorState from "../components/ErrorState";

export default function ClaimsPage() {
  const { user } = useAuth();

  // The backend has no CUSTOMER access to any Claims endpoint at all
  // (see flag at top of this response). Rather than firing requests that
  // will always 403, this shows an explanatory message for that role.
  if (user?.role === "CUSTOMER") {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Claims</h1>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Claims management isn't available to customer accounts yet. This requires
          linking your login to your customer profile, which hasn't been built on
          the backend yet. Please contact an administrator or agent to file or check
          on a claim.
        </p>
      </div>
    );
  }

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [statusClaim, setStatusClaim] = useState(null);
  const [editingClaim, setEditingClaim] = useState(null);

  const { data, isLoading, isError, refetch } = useClaims({
    page,
    per_page: 10,
    search: search || undefined,
    status: status || undefined
  });

  const sortedClaims = useMemo(() => {
    if (!data?.claims) return [];
    const list = [...data.claims];
    if (sort === "newest") return list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") return list.sort((a, b) => a.id - b.id);
    if (sort === "highest_amount")
      return list.sort((a, b) => Number(b.claim_amount) - Number(a.claim_amount));
    if (sort === "lowest_amount")
      return list.sort((a, b) => Number(a.claim_amount) - Number(b.claim_amount));
    return list;
  }, [data, sort]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Claims</h1>
          <p className="text-sm text-gray-500">Manage and process insurance claims</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
        >
          + File Claim
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 pb-0">
          <ClaimFilters
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            status={status}
            onStatusChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        {isLoading && <TableSkeleton rows={6} columns={6} />}

        {isError && (
          <div className="p-6">
            <ErrorState message="Couldn't load claims." onRetry={refetch} />
          </div>
        )}

        {!isLoading && !isError && sortedClaims.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-10">No claims found.</p>
        )}

        {!isLoading && !isError && sortedClaims.length > 0 && (
          <>
            <ClaimTable
              claims={sortedClaims}
              onUpdateStatus={setStatusClaim}
              onEdit={setEditingClaim}
            />
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <ClaimFormModal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />

      <ClaimStatusActionModal
        isOpen={!!statusClaim}
        onClose={() => setStatusClaim(null)}
        claim={statusClaim}
      />

      {/* Edit uses the same modal pattern via a dedicated small form on the
          detail page for simplicity -- see ClaimDetailPage's inline edit. */}
      {editingClaim && (
        <ClaimEditRedirectNotice claim={editingClaim} onClose={() => setEditingClaim(null)} />
      )}
    </div>
  );
}

// Small inline helper: editing claim details (amount/date/description) is
// done on the Claim Detail page, where the form has more room. Clicking
// "Edit" from the list just navigates there via a toast + link, avoiding
// a second full form modal duplicating ClaimDetailPage's edit form.
function ClaimEditRedirectNotice({ claim, onClose }) {
  const navigate = useNavigate();

  const handleGoToClaim = () => {
    onClose();
    navigate(`/claims/${claim.id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6 text-center">
        <p className="text-sm text-gray-700 mb-4">
          Editing claim <b>{claim.claim_number}</b> details is available on its detail page.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={handleGoToClaim}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-light"
          >
            Go to Claim
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
