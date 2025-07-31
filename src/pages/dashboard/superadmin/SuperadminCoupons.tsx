import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  ArrowLeft,
  TicketIcon,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Copy,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';

interface Coupon {
  id: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  usage_limit: number | null;
  used_count: number;
  valid_from: string;
  valid_until: string | null;
  status: 'active' | 'expired' | 'depleted';
  applicable_plans: string[] | null;
  created_at: string;
}

export function SuperadminCoupons() {
  const [, navigate] = useLocation();
  const { role, loading: permLoading } = usePermissions();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  // Form state
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    type: 'percentage' as const,
    value: '',
    usage_limit: '',
    valid_days: '30',
  });

  useEffect(() => {
    if (!permLoading && role !== 'superadmin') {
      toast.error('Access denied. Superadmin only.');
      navigate('/dashboard');
    }
  }, [role, permLoading, navigate]);

  useEffect(() => {
    if (role === 'superadmin') {
      fetchCoupons();
    }
  }, [role]);

  const fetchCoupons = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Failed to fetch coupons');
    } finally {
      setLoading(false);
    }
  };

  const generateCouponCode = () => {
    const prefix = newCoupon.type === 'percentage' ? 'SAVE' : 'OFF';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setNewCoupon((prev) => ({ ...prev, code: `${prefix}${random}` }));
  };

  const handleCreateCoupon = async () => {
    try {
      if (!newCoupon.code || !newCoupon.value) {
        toast.error('Please fill in all required fields');
        return;
      }

      const validUntil = newCoupon.valid_days
        ? addDays(new Date(), parseInt(newCoupon.valid_days)).toISOString()
        : null;

      const { error } = await supabase.from('coupons').insert({
        code: newCoupon.code.toUpperCase(),
        description: newCoupon.description,
        type: newCoupon.type,
        value: parseFloat(newCoupon.value),
        usage_limit: newCoupon.usage_limit ? parseInt(newCoupon.usage_limit) : null,
        valid_until: validUntil,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) throw error;

      toast.success('Coupon created successfully');
      setCreateDialogOpen(false);
      setNewCoupon({
        code: '',
        description: '',
        type: 'percentage',
        value: '',
        usage_limit: '',
        valid_days: '30',
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error creating coupon:', error);
      toast.error('Failed to create coupon');
    }
  };

  const handleDeleteCoupon = async () => {
    if (!selectedCoupon) return;

    try {
      const { error } = await supabase.from('coupons').delete().eq('id', selectedCoupon.id);

      if (error) throw error;

      toast.success('Coupon deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Coupon code copied to clipboard');
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (coupon.status === 'depleted') {
      return <Badge variant="secondary">Depleted</Badge>;
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch =
      coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coupon.description?.toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedStatus === 'all') return matchesSearch;

    if (selectedStatus === 'active') {
      return (
        matchesSearch &&
        coupon.status === 'active' &&
        (!coupon.valid_until || new Date(coupon.valid_until) > new Date())
      );
    }

    if (selectedStatus === 'expired') {
      return (
        matchesSearch &&
        (coupon.status === 'expired' ||
          (coupon.valid_until && new Date(coupon.valid_until) < new Date()))
      );
    }

    if (selectedStatus === 'depleted') {
      return matchesSearch && coupon.status === 'depleted';
    }

    return matchesSearch;
  });

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
        <h1 className="text-3xl font-bold text-gray-900">Coupon Management</h1>
        <p className="text-gray-600 mt-2">Create and manage discount coupons for subscriptions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Coupons</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    coupons.filter(
                      (c) =>
                        c.status === 'active' &&
                        (!c.valid_until || new Date(c.valid_until) > new Date())
                    ).length
                  }
                </p>
              </div>
              <TicketIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Uses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.reduce((sum, c) => sum + c.used_count, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Discount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coupons.length > 0
                    ? Math.round(
                        coupons
                          .filter((c) => c.type === 'percentage')
                          .reduce((sum, c) => sum + c.value, 0) /
                          coupons.filter((c) => c.type === 'percentage').length || 0
                      )
                    : 0}
                  %
                </p>
              </div>
              <Percent className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search coupons..."
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
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="depleted">Depleted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Coupon
            </Button>
          </div>
        </div>
      </Card>

      {/* Coupons Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type & Value</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoupons.map((coupon) => (
              <TableRow key={coupon.id}>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="font-mono font-semibold">{coupon.code}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCouponCode(coupon.code)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {coupon.description && (
                      <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {coupon.type === 'percentage' ? (
                      <>
                        <Percent className="h-4 w-4 text-gray-400" />
                        <span>{coupon.value}% off</span>
                      </>
                    ) : (
                      <>
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>${coupon.value} off</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{coupon.used_count} used</p>
                    {coupon.usage_limit && (
                      <p className="text-xs text-gray-500">of {coupon.usage_limit} limit</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {coupon.valid_until ? (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      {format(new Date(coupon.valid_until), 'MMM d, yyyy')}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No expiry</span>
                  )}
                </TableCell>
                <TableCell>{getStatusBadge(coupon)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedCoupon(coupon);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredCoupons.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No coupons found matching your criteria
          </div>
        )}
      </Card>

      {/* Create Coupon Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Coupon</DialogTitle>
            <DialogDescription>
              Create a discount coupon for new or existing subscriptions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="code">Coupon Code</Label>
                <div className="flex gap-2">
                  <Input
                    id="code"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="SAVE20"
                    className="uppercase"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={generateCouponCode}>
                    Generate
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="type">Discount Type</Label>
                <Select
                  value={newCoupon.type}
                  onValueChange={(value) =>
                    setNewCoupon((prev) => ({ ...prev, type: value as any }))
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="value">
                  {newCoupon.type === 'percentage' ? 'Discount %' : 'Discount Amount'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon((prev) => ({ ...prev, value: e.target.value }))}
                  placeholder={newCoupon.type === 'percentage' ? '20' : '5'}
                  min="0"
                  max={newCoupon.type === 'percentage' ? '100' : undefined}
                />
              </div>
              <div>
                <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  value={newCoupon.usage_limit}
                  onChange={(e) =>
                    setNewCoupon((prev) => ({ ...prev, usage_limit: e.target.value }))
                  }
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="valid_days">Valid for (days)</Label>
              <Input
                id="valid_days"
                type="number"
                value={newCoupon.valid_days}
                onChange={(e) => setNewCoupon((prev) => ({ ...prev, valid_days: e.target.value }))}
                placeholder="30"
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={newCoupon.description}
                onChange={(e) => setNewCoupon((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Special promotion for new users"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCoupon}>Create Coupon</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Coupon Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedCoupon && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Code:</strong> {selectedCoupon.code}
              </p>
              <p className="text-sm">
                <strong>Used:</strong> {selectedCoupon.used_count} times
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCoupon}>
              Delete Coupon
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
