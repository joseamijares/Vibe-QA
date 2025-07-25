import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Organization, OrganizationMember } from '@/types/database.types';

export function useOrganization() {
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [membership, setMembership] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setOrganization(null);
      setMembership(null);
      setLoading(false);
      return;
    }

    async function fetchOrganization() {
      try {
        // Get user's organization membership
        const { data: membershipData, error: membershipError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('user_id', user!.id)
          .single();

        if (membershipError) throw membershipError;
        if (!membershipData) {
          throw new Error('No organization found for user');
        }

        setMembership(membershipData);

        // Get organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membershipData.organization_id)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [user]);

  return { organization, membership, loading, error };
}
