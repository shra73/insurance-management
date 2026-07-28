import "../../lib/chartSetup";
import { Bar } from "react-chartjs-2";
import ChartCard from "./ChartCard";
import ChartSkeleton from "../skeletons/ChartSkeleton";
import ErrorState from "../ErrorState";
import { useMonthlyPremiums } from "../../hooks/useDashboardData";

export default function MonthlyPremiumsChart() {
  const { data, isLoading, isError, refetch } = useMonthlyPremiums();

  if (isLoading) return <ChartSkeleton />;
  if (isError)
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <ErrorState
          message="Couldn't load monthly premium data."
          onRetry={refetch}
        />
      </div>
    );

  const chartData = {
    labels: data.map((row) => row.month),
    datasets: [
      {
        label: "Premium Collected (₹)",
        data: data.map((row) => Number(row.total)),
        backgroundColor: "#1a2b4c",
        borderRadius: 4
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <ChartCard title="Monthly Premium Collection">
      <Bar data={chartData} options={options} />
    </ChartCard>
  );
}