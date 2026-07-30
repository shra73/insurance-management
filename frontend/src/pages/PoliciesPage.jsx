import { useState, useMemo } from "react";
import { usePolicies } from "../hooks/usePolicies";
import { useDeletePolicy } from "../hooks/usePolicyMutations";
import PolicyTable from "../components/policies/PolicyTable";
import PolicyFilters from "../components/policies/PolicyFilters";
import PolicyFormModal from "../components/policies/PolicyFormModal";
import RenewPolicyModal from "../components/policies/RenewPolicyModal";
import CancelPolicyModal from "../components/policies/CancelPolicyModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import ErrorState from "../components/ErrorState";

export default function PoliciesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("newest");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [renewingPolicy, setRenewingPolicy] = useState(null);
  const [cancellingPolicy, setCancellingPolicy] = useState(null);
  const [deletingPolicy, setDeletingPolicy] = useState(null);

  const { data, isLoading, isError, refetch } = usePolicies({
    page,
    per_page: 10,
    search: search || undefined,
    status: status || undefined,
    type: type || undefined
  });
  const deleteMutation = useDeletePolicy();

  // Client-side sort across the current page only -- backend has no
  // sort parameter (see flags above).
  const sortedPolicies = useMemo(() => {
    if (!data?.policies) return [];
    const list = [...data.policies];
    if (sort === "newest") return list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") return list.sort((a, b) => a.id - b.id);
    if (sort === "highest_premium")
      return list.sort((a, b) => Number(b.premium_amount) - Number(a.premium_amount));
    if (sort === "lowest_premium")
      return list.sort((a, b) => Number(a.premium_amount) - Number(b.premium_amount));
    return list;
  }, [data, sort]);

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deletingPolicy.id, {
      onSuccess: () => setDeletingPolicy(null),
      onError: () => setDeletingPolicy(null)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Policies</h1>
          <p className="text-sm text-gray-500">Manage insurance policies</p>
        </div>
        <button
          onClick={() => {
            setEditingPolicy(null);
            setIsFormOpen(true);
          }}
          className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
        >
          + Create Policy
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 pb-0">
          <PolicyFilters
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
            type={type}
            onTypeChange={(v) => {
              setType(v);
              setPage(1);
            }}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        {isLoading && <TableSkeleton rows={6} columns={7} />}

        {isError && (
          <div className="p-6">
            <ErrorState message="Couldn't load policies." onRetry={refetch} />
          </div>
        )}

        {!isLoading && !isError && sortedPolicies.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-10">No policies found.</p>
        )}

        {!isLoading && !isError && sortedPolicies.length > 0 && (
          <>
            <PolicyTable
              policies={sortedPolicies}
              onEdit={(p) => {
                setEditingPolicy(p);
                setIsFormOpen(true);
              }}
              onRenew={setRenewingPolicy}
              onCancel={setCancellingPolicy}
              onDelete={setDeletingPolicy}
            />
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <PolicyFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        policy={editingPolicy}
      />

      <RenewPolicyModal
        isOpen={!!renewingPolicy}
        onClose={() => setRenewingPolicy(null)}
        policy={renewingPolicy}
      />

      <CancelPolicyModal
        isOpen={!!cancellingPolicy}
        onClose={() => setCancellingPolicy(null)}
        policy={cancellingPolicy}
      />

      <ConfirmModal
        isOpen={!!deletingPolicy}
        title="Delete Policy"
        message={`Are you sure you want to permanently delete policy "${deletingPolicy?.policy_number}"? This cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingPolicy(null)}
      />
    </div>
  );
}