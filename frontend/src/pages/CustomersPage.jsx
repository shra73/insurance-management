import { useState, useMemo } from "react";
import { useCustomers } from "../hooks/useCustomers";
import { useDeleteCustomer } from "../hooks/useCustomerMutations";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerFilters from "../components/customers/CustomerFilters";
import CustomerFormModal from "../components/customers/CustomerFormModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import Button from "../components/ui/Button";

export default function CustomersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [deletingCustomer, setDeletingCustomer] = useState(null);

  const { data, isLoading, isError, refetch } = useCustomers({
    page,
    per_page: 10,
    search: search || undefined
  });
  const deleteMutation = useDeleteCustomer();

  const sortedCustomers = useMemo(() => {
    if (!data?.customers) return [];
    const list = [...data.customers];
    if (sort === "newest") return list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") return list.sort((a, b) => a.id - b.id);
    if (sort === "alphabetical") return list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [data, sort]);

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deletingCustomer.id, {
      onSuccess: () => setDeletingCustomer(null),
      onError: () => setDeletingCustomer(null)
    });
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your policyholders</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditingCustomer(null);
            setIsFormOpen(true);
          }}
        >
          + Add customer
        </Button>
      </div>

      <div className="card">
        <div className="p-5 pb-0">
          <CustomerFilters
            search={search}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        <div className="mt-4">
          {isLoading && <TableSkeleton rows={6} columns={6} />}

          {isError && (
            <div className="p-6">
              <ErrorState message="Couldn't load customers." onRetry={refetch} />
            </div>
          )}

          {!isLoading && !isError && sortedCustomers.length === 0 && (
            <EmptyState
              title="No customers found"
              description={search ? "Try a different search term." : "Add your first customer to get started."}
              action={
                !search && (
                  <Button variant="secondary" size="sm" onClick={() => setIsFormOpen(true)}>
                    + Add customer
                  </Button>
                )
              }
            />
          )}

          {!isLoading && !isError && sortedCustomers.length > 0 && (
            <>
              <CustomerTable
                customers={sortedCustomers}
                onEdit={(c) => { setEditingCustomer(c); setIsFormOpen(true); }}
                onDelete={setDeletingCustomer}
              />
              <Pagination pagination={data.pagination} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={editingCustomer}
      />

      <ConfirmModal
        isOpen={!!deletingCustomer}
        title="Delete customer"
        message={`Are you sure you want to delete "${deletingCustomer?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCustomer(null)}
      />
    </div>
  );
}