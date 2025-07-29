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
        // Get user's organization membership (get first if multiple)
        const { data: membershipData, error: membershipError } = await supabase
          .from('organization_members')
          .select('*')
          .eq('user_id', user!.id)
          .order('joined_at', { ascending: false }) // Get most recent
          .limit(1)
          .maybeSingle(); // Returns null if no rows, data if one row

        if (membershipError || !membershipData) {
          // User has no organization yet - this can happen for manually created users
          console.log('No organization found for user, may need to run setup');
          setError(new Error('No organization found. Please contact support.'));
          setLoading(false);
          return;
        }

        setMembership(membershipData);

        // Get organization details
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', membershipData.organization_id)
          .single();

        if (orgError) {
          console.error('Error fetching organization details:', orgError);
          throw orgError;
        }

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
