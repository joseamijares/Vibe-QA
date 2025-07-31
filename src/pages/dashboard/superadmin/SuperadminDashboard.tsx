import { useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { usePermissions } from '@/hooks/usePermissions';
import { Card } from '@/components/ui/card';
import {
  Users,
  CreditCard,
  TicketIcon,
  DollarSign,
  Activity,
  Shield,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';

export function SuperadminDashboard() {
  const [, navigate] = useLocation();
  const { role, loading } = usePermissions();

  useEffect(() => {
    if (!loading && role !== 'superadmin') {
      toast.error('Access denied. Superadmin only.');
      navigate('/dashboard');
    }
  }, [role, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (role !== 'superadmin') {
    return null;
  }

  const adminSections = [
    {
      title: 'User Management',
      description: 'View and manage all platform users',
      href: '/dashboard/superadmin/users',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Subscriptions',
      description: 'Review and manage all subscriptions',
      href: '/dashboard/superadmin/subscriptions',
      icon: CreditCard,
      color: 'bg-green-500',
    },
    {
      title: 'Coupons',
      description: 'Create and manage discount coupons',
      href: '/dashboard/superadmin/coupons',
      icon: TicketIcon,
      color: 'bg-purple-500',
    },
    {
      title: 'System Metrics',
      description: 'View server and app performance metrics',
      href: '/dashboard/superadmin/metrics',
      icon: Activity,
      color: 'bg-orange-500',
    },
    {
      title: 'Revenue Analytics',
      description: 'Track revenue, MRR, and growth metrics',
      href: '/dashboard/superadmin/revenue',
      icon: DollarSign,
      color: 'bg-indigo-500',
    },
    {
      title: 'Audit Logs',
      description: 'View all superadmin actions',
      href: '/dashboard/superadmin/audit',
      icon: Shield,
      color: 'bg-red-500',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Superadmin Panel</h1>
        <p className="text-gray-600 mt-2">Platform-wide administration for support@vibeqa.app</p>
      </div>

      {/* Security Notice */}
      <Card className="mb-8 border-yellow-200 bg-yellow-50">
        <div className="p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Security Notice</h3>
              <p className="text-sm text-yellow-700 mt-1">
                All actions performed in this panel are logged for audit purposes. Please ensure you
                have authorization before making any changes.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Admin Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link key={section.href} href={section.href}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`${section.color} p-3 rounded-lg text-white`}>
                    <section.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Active Coupons</p>
              <p className="text-2xl font-bold text-gray-900">-</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
