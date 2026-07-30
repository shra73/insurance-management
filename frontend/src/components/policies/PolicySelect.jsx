import { useQuery } from "@tanstack/react-query";
import { fetchPolicies } from "../../services/policyService";

export default function PolicySelect({ value, onChange, error }) {
  const { data, isLoading } = useQuery({
    queryKey: ["policies", "selectAll"],
    queryFn: () => fetchPolicies({ page: 1, per_page: 100 })
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Policy</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        disabled={isLoading}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      >
        <option value="">{isLoading ? "Loading policies..." : "Select a policy"}</option>
        {data?.policies?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.policy_number} ({p.type})
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
}