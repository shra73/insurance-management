import "../../lib/chartSetup";
import { Doughnut } from "react-chartjs-2";
import ChartCard from "./ChartCard";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import ErrorState from "../ErrorState";
import { useClaimStatus } from "../../hooks/useDashboardData";

const STATUS_COLORS = {
  PENDING: "#d97706",
  UNDER_REVIEW: "#2563eb",
  APPROVED: "#16a34a",
  REJECTED: "#c0392b",
  SETTLED: "#1a2b4c"
};

export default function ClaimStatusChart() {
  const { data, isLoading, isError, refetch } = useClaimStatus();

  if (isLoading) return <ChartSkeleton />;
  if (isError)
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ErrorState message="Couldn't load claim status data." onRetry={refetch} />
      </div>
    );

  const labels = Object.keys(data);
  const values = Object.values(data);

  const chartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: labels.map((label) => STATUS_COLORS[label] || "#94a3b8"),
        borderWidth: 0
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { boxWidth: 12, font: { size: 11 } } } }
  };

  return (
    <ChartCard title="Claim Status">
      <Doughnut data={chartData} options={options} />
    </ChartCard>
  );
}