export default function ProfileInfoCard({ user }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Profile Information</h3>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-gray-500">Full Name</dt>
          <dd className="font-medium text-gray-900">{user?.name || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Email</dt>
          <dd className="font-medium text-gray-900">{user?.email || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">Role</dt>
          <dd className="font-medium text-gray-900">{user?.role || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500">User ID</dt>
          <dd className="font-medium text-gray-900">#{user?.id ?? "—"}</dd>
        </div>
      </dl>
      <p className="text-xs text-gray-400 mt-4">
        Phone number, date joined, and last login aren't currently tracked or
        returned by the backend, so they aren't shown here.
      </p>
    </div>
  );
}