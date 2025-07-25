import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, XCircle, UserPlus, AlertCircle } from 'lucide-react';
import { Invitation, Organization } from '@/types/database.types';

export function AcceptInvitationPage() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract invitation ID from URL
  const invitationId = location.split('/').pop();

  useEffect(() => {
    if (!invitationId) {
      setError('Invalid invitation link');
      setLoading(false);
      return;
    }

    fetchInvitation();
  }, [invitationId, user]);

  const fetchInvitation = async () => {
    try {
      // Fetch invitation details
      const { data: inviteData, error: inviteError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (inviteError || !inviteData) {
        setError('Invitation not found');
        return;
      }

      // Check if invitation is expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invitation has expired');
        return;
      }

      // Check if already accepted
      if (inviteData.accepted_at) {
        setError('This invitation has already been accepted');
        return;
      }

      setInvitation(inviteData);

      // Fetch organization details
      const { data: orgData } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', inviteData.organization_id)
        .single();

      if (orgData) {
        setOrganization(orgData);
      }

      // If user is logged in, check if email matches
      if (user && user.email !== inviteData.email) {
        setError(
          `This invitation is for ${inviteData.email}. Please sign out and sign in with the correct email.`
        );
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
      setError('Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setAccepting(true);
    try {
      // Start a transaction
      const { error: memberError } = await supabase.from('organization_members').insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        role: invitation.role,
      });

      if (memberError) {
        // Check if user is already a member
        if (memberError.code === '23505') {
          // Unique constraint violation
          setError('You are already a member of this organization');
        } else {
          throw memberError;
        }
        return;
      }

      // Mark invitation as accepted
      const { error: updateError } = await supabase
        .from('invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activity_logs').insert({
        organization_id: invitation.organization_id,
        user_id: user.id,
        action: 'invitation_accepted',
        resource_type: 'invitation',
        resource_id: invitation.id,
        metadata: { email: invitation.email, role: invitation.role },
      });

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setError('Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094765] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invitation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#094765] via-[#3387a7] to-[#156c8b] flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <img src="/src/assets/vibe-code-logo.svg" alt="VibeQA" className="h-12 mx-auto mb-4" />

          {error ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h1>
              <p className="text-gray-600">{error}</p>
              <Button onClick={() => navigate('/login')} className="mt-6" variant="outline">
                Go to Login
              </Button>
            </>
          ) : !user ? (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h1>
              <p className="text-gray-600 mb-6">
                You need to sign in to accept this invitation to join{' '}
                <span className="font-semibold">{organization?.name}</span>
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate(`/login?redirect=/accept-invitation/${invitationId}`)}
                  className="w-full"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate(`/register?redirect=/accept-invitation/${invitationId}`)}
                  variant="outline"
                  className="w-full"
                >
                  Create Account
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
              <p className="text-gray-600">
                You've been invited to join{' '}
                <span className="font-semibold">{organization?.name}</span> as a{' '}
                <span className="font-semibold">{invitation?.role}</span>
              </p>
            </>
          )}
        </div>

        {!error && user && invitation && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Invited by:</span>{' '}
                {invitation.invited_by || 'Team Admin'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Your email:</span> {invitation.email}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Role:</span> {invitation.role}
              </p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAcceptInvitation} disabled={accepting} className="flex-1">
                {accepting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept Invitation
                  </>
                )}
              </Button>
              <Button onClick={() => navigate('/dashboard')} variant="outline" disabled={accepting}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
