import { Link } from "react-router-dom";
import PolicyCountBadge from "./PolicyCountBadge";

export default function CustomerTable({ customers, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">
            <th className="px-5 py-3">ID</th>
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Email</th>
            <th className="px-5 py-3">Phone</th>
            <th className="px-5 py-3">Policies</th>
            <th className="px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-5 py-3.5 text-slate-400">#{customer.id}</td>
              <td className="px-5 py-3.5">
                <Link
                  to={`/customers/${customer.id}`}
                  className="font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400 rounded"
                >
                  {customer.name}
                </Link>
              </td>
              <td className="px-5 py-3.5 text-slate-600">{customer.email}</td>
              <td className="px-5 py-3.5 text-slate-600">{customer.phone}</td>
              <td className="px-5 py-3.5 text-slate-600">
                <PolicyCountBadge customerId={customer.id} />
              </td>
              <td className="px-5 py-3.5">
                <div className="flex justify-end gap-4 text-xs font-medium">
                  <button
                    onClick={() => onEdit(customer)}
                    className="text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-400 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(customer)}
                    className="text-danger-600 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-danger-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}