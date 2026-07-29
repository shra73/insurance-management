import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { useCustomers } from "../hooks/useCustomers";
import { useDeleteCustomer } from "../hooks/useCustomerMutations";
import CustomerTable from "../components/customers/CustomerTable";
import CustomerFilters from "../components/customers/CustomerFilters";
import CustomerFormModal from "../components/customers/CustomerFormModal";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import ErrorState from "../components/ErrorState";

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

  // Sorting happens client-side, only across the CURRENT page's rows --
  // the backend has no sort parameter. "id" stands in for creation order
  // since the API doesn't expose created_at.
  const sortedCustomers = useMemo(() => {
    if (!data?.customers) return [];
    const list = [...data.customers];
    if (sort === "newest") return list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") return list.sort((a, b) => a.id - b.id);
    if (sort === "alphabetical") return list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [data, sort]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate(deletingCustomer.id, {
      onSuccess: () => setDeletingCustomer(null),
      onError: () => setDeletingCustomer(null)
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500">Manage your policyholders</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
        >
          + Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 pb-0">
          <CustomerFilters
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            sort={sort}
            onSortChange={setSort}
          />
        </div>

        {isLoading && <TableSkeleton rows={6} columns={6} />}

        {isError && (
          <div className="p-6">
            <ErrorState message="Couldn't load customers." onRetry={refetch} />
          </div>
        )}

        {!isLoading && !isError && sortedCustomers.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-10">
            No customers found.
          </p>
        )}

        {!isLoading && !isError && sortedCustomers.length > 0 && (
          <>
            <CustomerTable
              customers={sortedCustomers}
              onEdit={handleOpenEdit}
              onDelete={setDeletingCustomer}
            />
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <CustomerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        customer={editingCustomer}
      />

      <ConfirmModal
        isOpen={!!deletingCustomer}
        title="Delete Customer"
        message={`Are you sure you want to delete "${deletingCustomer?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={deleteMutation.isPending}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingCustomer(null)}
      />
    </div>
  );
}