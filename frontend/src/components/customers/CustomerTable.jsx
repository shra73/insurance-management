import { Link } from "react-router-dom";
import PolicyCountBadge from "./PolicyCountBadge";

export default function CustomerTable({ customers, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-200">
            <th className="px-4 py-3">ID</th>
            <th className="px-4 py-3">Full Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Policies</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-gray-500">#{customer.id}</td>
              <td className="px-4 py-3">
                <Link
                  to={`/customers/${customer.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {customer.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-gray-600">{customer.email}</td>
              <td className="px-4 py-3 text-gray-600">{customer.phone}</td>
              <td className="px-4 py-3 text-gray-600">
                <PolicyCountBadge customerId={customer.id} />
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-3">
                  <button
                    onClick={() => onEdit(customer)}
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(customer)}
                    className="text-red-600 hover:underline text-xs font-medium"
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