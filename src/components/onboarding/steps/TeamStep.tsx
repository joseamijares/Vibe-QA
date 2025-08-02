import { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Users, Mail, Plus, X, Loader2 } from 'lucide-react';

interface TeamStepProps {
  onNext: () => void;
}

interface TeamMember {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

export function TeamStep({ onNext }: TeamStepProps) {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ email: '', role: 'member' }]);

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { email: '', role: 'member' }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const handleInviteTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    const validMembers = teamMembers.filter((m) => m.email.trim());

    if (validMembers.length === 0) {
      onNext();
      return;
    }

    if (!organization) {
      toast({
        title: 'Error',
        description: 'No organization found',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create invitations for each team member
      const invitations = validMembers.map((member) => ({
        organization_id: organization.id,
        email: member.email.toLowerCase(),
        role: member.role,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      }));

      const { error } = await supabase.from('invitations').insert(invitations);

      if (error) throw error;

      // Send invitation emails via edge function
      for (const member of validMembers) {
        try {
          await supabase.functions.invoke('send-invitation-email', {
            body: {
              email: member.email,
              organizationName: organization.name,
              inviterName: 'Your teammate', // You might want to get this from the user profile
              role: member.role,
            },
          });
        } catch (emailError) {
          console.error('Error sending invitation email:', emailError);
        }
      }

      toast({
        title: 'Invitations sent!',
        description: `${validMembers.length} team member(s) invited successfully.`,
      });

      onNext();
    } catch (error: any) {
      console.error('Error inviting team:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Users className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Invite Your Team</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Collaborate with your team by inviting them to your organization. You can skip this step
          and invite team members later.
        </p>
      </div>

      <form onSubmit={handleInviteTeam} className="space-y-4">
        <div className="space-y-3">
          {teamMembers.map((member, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="teammate@example.com"
                  value={member.email}
                  onChange={(e) => updateTeamMember(index, 'email', e.target.value)}
                  disabled={loading}
                  className="w-full"
                />
              </div>
              <select
                value={member.role}
                onChange={(e) => updateTeamMember(index, 'role', e.target.value as any)}
                disabled={loading}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#094765] focus:border-transparent"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              {teamMembers.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeTeamMember(index)}
                  disabled={loading}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={addTeamMember}
          disabled={loading || teamMembers.length >= 10}
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Team Member
        </Button>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-gray-900">Role Permissions:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>
              <strong>Admin:</strong> Can manage projects, team, and settings
            </li>
            <li>
              <strong>Member:</strong> Can view and respond to feedback
            </li>
            <li>
              <strong>Viewer:</strong> Can only view feedback (read-only)
            </li>
          </ul>
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading} className="flex-1 magnetic-button">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Invitations...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Invitations
              </>
            )}
          </Button>
          <Button type="button" variant="outline" onClick={onNext} disabled={loading}>
            Skip for now
          </Button>
        </div>
      </form>
    </div>
  );
}
