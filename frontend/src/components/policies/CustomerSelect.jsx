import { useQuery } from "@tanstack/react-query";
import { fetchCustomers } from "../../services/customerService";

export default function CustomerSelect({ value, onChange, error }) {
  // Fetches a reasonably large page of customers for the dropdown.
  // Fine at current scale; would need a searchable async-select for a
  // very large customer base.
  const { data, isLoading } = useQuery({
    queryKey: ["customers", "selectAll"],
    queryFn: () => fetchCustomers({ page: 1, per_page: 100 })
  });

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : "")}
        disabled={isLoading}
        className={`w-full px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 ${
          error ? "border-red-400" : "border-gray-300"
        }`}
      >
        <option value="">{isLoading ? "Loading customers..." : "Select a customer"}</option>
        {data?.customers?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.email})
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-xs mt-1">{error.message}</p>}
    </div>
  );
}