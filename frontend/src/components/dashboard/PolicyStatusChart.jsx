import "../../lib/chartSetup";
import { Pie } from "react-chartjs-2";
import ChartCard from "./ChartCard";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import ErrorState from "../ErrorState";
import { usePolicyStatus } from "../../hooks/useDashboardData";

const STATUS_COLORS = {
  ACTIVE: "#1a2b4c",
  EXPIRED: "#9ca3af",
  CANCELLED: "#c0392b",
  PENDING: "#d97706"
};

export default function PolicyStatusChart() {
  const { data, isLoading, isError, refetch } = usePolicyStatus();

  if (isLoading) return <ChartSkeleton />;
  if (isError)
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ErrorState message="Couldn't load policy status data." onRetry={refetch} />
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
    <ChartCard title="Policy Status">
      <Pie data={chartData} options={options} />
    </ChartCard>
  );
}