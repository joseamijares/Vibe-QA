import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

export function NoOrganizationMessage() {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization Setup Required</h2>

          <p className="text-gray-600 mb-6">
            Your account needs to be associated with an organization. This usually happens
            automatically, but it seems there was an issue.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              <strong>What to do:</strong>
            </p>
            <ol className="text-sm text-gray-600 mt-2 text-left list-decimal list-inside space-y-1">
              <li>Contact your administrator</li>
              <li>Or run the organization setup script</li>
              <li>Then log in again</li>
            </ol>
          </div>

          <Button onClick={() => signOut()} variant="outline" className="w-full">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
