import "../../lib/chartSetup";
import { Line } from "react-chartjs-2";
import ChartCard from "./ChartCard";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import ErrorState from "../ErrorState";
import { useMonthlyClaims } from "../../hooks/useDashboardData";

export default function MonthlyClaimsChart() {
  const { data, isLoading, isError, refetch } = useMonthlyClaims();

  if (isLoading) return <ChartSkeleton />;
  if (isError)
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ErrorState message="Couldn't load monthly claims data." onRetry={refetch} />
      </div>
    );

  const chartData = {
    labels: data.map((row) => row.month),
    datasets: [
      {
        label: "Claims Filed",
        data: data.map((row) => row.claims),
        borderColor: "#c0392b",
        backgroundColor: "rgba(192, 57, 43, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 3
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
  };

  return (
    <ChartCard title="Monthly Claims">
      <Line data={chartData} options={options} />
    </ChartCard>
  );
}