import { useAuth } from "../hooks/useAuth";
import ProfileInfoCard from "../components/profile/ProfileInfoCard";
import SessionInfoCard from "../components/profile/SessionInfoCard";
import EditProfileForm from "../components/profile/EditProfileForm";
import ChangePasswordForm from "../components/profile/ChangePasswordForm";
import UnavailableFeatureCard from "../components/profile/UnavailableFeatureCard";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorState from "../components/ErrorState";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  // Proper loading/error guard: while AuthContext is still resolving on
  // first mount, show a spinner instead of momentarily rendering blank
  // "-" fields. If loading has finished but there's still no user (an
  // unexpected/broken state -- e.g. storage was cleared mid-session),
  // show a real error state instead of silently rendering an empty page.
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return (
      <ErrorState
        message="We couldn't load your account information. Please try logging in again."
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-sm text-gray-500">Manage your account information</p>
      </div>

      <ProfileInfoCard user={user} />

      <EditProfileForm user={user} />

      <ChangePasswordForm />

      <SessionInfoCard />

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Account Settings</h3>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Role</dt>
            <dd className="font-medium text-gray-900">{user.role}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Account Status</dt>
            <dd className="font-medium text-gray-900">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Active
              </span>
            </dd>
          </div>
        </dl>
        <p className="text-xs text-gray-400 mt-4">
          Account status here simply reflects that you have a valid, active
          session — the backend doesn't currently track a separate
          enabled/disabled account state.
        </p>
      </div>

      <UnavailableFeatureCard
        title="Profile Picture"
        description="Profile pictures aren't supported yet — the User model has no field for an avatar/image, and there's no upload endpoint for it."
      />
    </div>
  );
}
