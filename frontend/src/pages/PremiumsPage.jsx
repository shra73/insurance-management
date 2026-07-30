import { useState, useMemo } from "react";
import { toast } from "react-toastify";
import { usePremiums } from "../hooks/usePremiums";
import { downloadPremiumReportPdf } from "../services/premiumService";
import PremiumTable from "../components/premiums/PremiumTable";
import PremiumFilters from "../components/premiums/PremiumFilters";
import RecordPaymentModal from "../components/premiums/RecordPaymentModal";
import Pagination from "../components/Pagination";
import TableSkeleton from "../components/skeletons/TableSkeleton";
import ErrorState from "../components/ErrorState";

export default function PremiumsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { data, isLoading, isError, refetch } = usePremiums({
    page,
    per_page: 10,
    search: search || undefined,
    payment_status: status || undefined
  });

  const sortedPremiums = useMemo(() => {
    if (!data?.premiums) return [];
    const list = [...data.premiums];
    if (sort === "newest") return list.sort((a, b) => b.id - a.id);
    if (sort === "oldest") return list.sort((a, b) => a.id - b.id);
    if (sort === "highest_amount") return list.sort((a, b) => Number(b.amount) - Number(a.amount));
    if (sort === "lowest_amount") return list.sort((a, b) => Number(a.amount) - Number(b.amount));
    return list;
  }, [data, sort]);

  const handleDownloadReport = async () => {
    setIsDownloading(true);
    try {
      await downloadPremiumReportPdf();
      toast.success("Premium report downloaded");
    } catch {
      toast.error("Failed to download report");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Premiums</h1>
          <p className="text-sm text-gray-500">Track premium payments and outstanding balances</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
          >
            {isDownloading ? "Downloading..." : "Download Report (PDF)"}
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
          >
            + Record Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 pb-0">
          <PremiumFilters
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

        {isLoading && <TableSkeleton rows={6} columns={8} />}

        {isError && (
          <div className="p-6">
            <ErrorState message="Couldn't load premium payments." onRetry={refetch} />
          </div>
        )}

        {!isLoading && !isError && sortedPremiums.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-10">No premium payments found.</p>
        )}

        {!isLoading && !isError && sortedPremiums.length > 0 && (
          <>
            <PremiumTable premiums={sortedPremiums} />
            <Pagination pagination={data.pagination} onPageChange={setPage} />
          </>
        )}
      </div>

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
      />
    </div>
  );
}