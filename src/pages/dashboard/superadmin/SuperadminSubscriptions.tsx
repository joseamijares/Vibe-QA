import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  ArrowLeft,
  CreditCard,
  Calendar,
  Building,
  XCircle,
  CheckCircle,
  AlertCircle,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscription {
  id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  plan: {
    id: string;
    name: string;
    price_monthly: number;
  };
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at: string | null;
  canceled_at: string | null;
  stripe_subscription_id: string;
  created_at: string;
}

export function SuperadminSubscriptions() {
  const [, navigate] = useLocation();
  const { role, loading: permLoading } = usePermissions();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    if (!permLoading && role !== 'superadmin') {
      toast.error('Access denied. Superadmin only.');
      navigate('/dashboard');
    }
  }, [role, permLoading, navigate]);

  useEffect(() => {
    if (role === 'superadmin') {
      fetchSubscriptions();
    }
  }, [role]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      // Fetch all subscriptions with organization and plan details
      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select(
          `
          *,
          organization:organizations(id, name, slug),
          plan:subscription_plans(id, name, price_monthly)
        `
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSubscriptions(data || []);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to fetch subscriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) return;

    try {
      // In a real implementation, this would call Stripe API to cancel
      const { error } = await supabase
        .from('organization_subscriptions')
        .update({
          status: 'canceled',
          canceled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedSubscription.id);

      if (error) throw error;

      toast.success('Subscription canceled successfully');
      setCancelDialogOpen(false);
      setSelectedSubscription(null);
      fetchSubscriptions();
    } catch (error) {
      console.error('Error canceling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Active', variant: 'default' as const, icon: CheckCircle },
      trialing: { label: 'Trial', variant: 'secondary' as const, icon: AlertCircle },
      canceled: { label: 'Canceled', variant: 'destructive' as const, icon: XCircle },
      past_due: { label: 'Past Due', variant: 'destructive' as const, icon: AlertCircle },
      unpaid: { label: 'Unpaid', variant: 'destructive' as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
      icon: AlertCircle,
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.organization.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || sub.status === selectedStatus;
    const matchesPlan = selectedPlan === 'all' || sub.plan?.id === selectedPlan;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  const totalMRR = filteredSubscriptions
    .filter((sub) => sub.status === 'active' || sub.status === 'trialing')
    .reduce((sum, sub) => sum + (sub.plan?.price_monthly || 0), 0);

  if (permLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (role !== 'superadmin') {
    return null;
  }

  const uniquePlans = Array.from(new Set(subscriptions.map((s) => s.plan?.id).filter(Boolean)))
    .map((planId) => {
      const sub = subscriptions.find((s) => s.plan?.id === planId);
      return sub?.plan;
    })
    .filter(Boolean);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard/superadmin')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Superadmin
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600 mt-2">View and manage all platform subscriptions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total MRR</p>
                <p className="text-2xl font-bold text-gray-900">${totalMRR}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter((s) => s.status === 'active').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Trial Subscriptions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter((s) => s.status === 'trialing').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Canceled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter((s) => s.status === 'canceled').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search organizations or subscription IDs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trialing">Trial</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="past_due">Past Due</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                {uniquePlans.map((plan) => (
                  <SelectItem key={plan!.id} value={plan!.id}>
                    {plan!.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.map((subscription) => (
              <TableRow key={subscription.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{subscription.organization.name}</p>
                      <p className="text-xs text-gray-500">
                        {subscription.stripe_subscription_id || 'No Stripe ID'}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">{subscription.plan?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        ${subscription.plan?.price_monthly || 0}/mo
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>
                      {format(new Date(subscription.current_period_start), 'MMM d')} -{' '}
                      {subscription.current_period_end
                        ? format(new Date(subscription.current_period_end), 'MMM d, yyyy')
                        : 'Ongoing'}
                    </p>
                    {subscription.cancel_at && (
                      <p className="text-xs text-red-600">
                        Cancels: {format(new Date(subscription.cancel_at), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(subscription.created_at), 'MMM d, yyyy')}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {subscription.status === 'active' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setCancelDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      Cancel
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredSubscriptions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No subscriptions found matching your criteria
          </div>
        )}
      </Card>

      {/* Cancel Subscription Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription? The organization will lose access
              at the end of the current billing period.
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="py-4 space-y-2">
              <p className="text-sm">
                <strong>Organization:</strong> {selectedSubscription.organization.name}
              </p>
              <p className="text-sm">
                <strong>Plan:</strong> {selectedSubscription.plan?.name}
              </p>
              <p className="text-sm">
                <strong>Current Period Ends:</strong>{' '}
                {selectedSubscription.current_period_end
                  ? format(new Date(selectedSubscription.current_period_end), 'MMMM d, yyyy')
                  : 'Unknown'}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button variant="destructive" onClick={handleCancelSubscription}>
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
