import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { usePermissions } from '@/hooks/usePermissions';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Users,
  CreditCard,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subMonths, startOfMonth } from 'date-fns';

interface RevenueReport {
  id: string;
  period_start: string;
  period_end: string;
  total_revenue: number;
  subscription_revenue: number;
  one_time_revenue: number;
  refunds: number;
  net_revenue: number;
  new_customers: number;
  churned_customers: number;
  mrr: number;
  arr: number;
  average_revenue_per_user: number;
  created_at: string;
}

interface PlanRevenue {
  plan: string;
  revenue: number;
  customers: number;
}

interface GrowthMetric {
  month: string;
  mrr: number;
  customers: number;
  arpu: number;
  churn: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function SuperadminRevenue() {
  const [, navigate] = useLocation();
  const { role, loading: permLoading } = usePermissions();
  const [reports, setReports] = useState<RevenueReport[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetric[]>([]);
  const [planRevenue, setPlanRevenue] = useState<PlanRevenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('6m');

  useEffect(() => {
    if (!permLoading && role !== 'superadmin') {
      toast.error('Access denied. Superadmin only.');
      navigate('/dashboard');
    }
  }, [role, permLoading, navigate]);

  useEffect(() => {
    if (role === 'superadmin') {
      fetchRevenueData();
    }
  }, [role, timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const monthsAgo = timeRange === '3m' ? 3 : timeRange === '6m' ? 6 : 12;
      const startDate = startOfMonth(subMonths(new Date(), monthsAgo));

      // Fetch revenue reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('revenue_reports')
        .select('*')
        .gte('period_start', startDate.toISOString())
        .order('period_start', { ascending: true });

      if (reportsError) throw reportsError;

      setReports(reportsData || []);

      // Process data for charts
      processGrowthMetrics(reportsData || []);
      processPlanRevenue(reportsData || []);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      toast.error('Failed to fetch revenue data');
    } finally {
      setLoading(false);
    }
  };

  const processGrowthMetrics = (reports: RevenueReport[]) => {
    const metrics = reports.map((report) => ({
      month: format(new Date(report.period_start), 'MMM yyyy'),
      mrr: report.mrr,
      customers: report.new_customers - report.churned_customers,
      arpu: report.average_revenue_per_user,
      churn: report.churned_customers,
    }));
    setGrowthMetrics(metrics);
  };

  const processPlanRevenue = (_reports: RevenueReport[]) => {
    // Mock data for plan distribution - in real app, this would come from the database
    const plans = [
      { plan: 'Free', revenue: 0, customers: 245 },
      { plan: 'Basic', revenue: 2500, customers: 50 },
      { plan: 'Full', revenue: 5600, customers: 40 },
      { plan: 'Enterprise', revenue: 12000, customers: 12 },
    ];
    setPlanRevenue(plans);
  };

  const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getCurrentMetrics = () => {
    const current = reports[reports.length - 1];
    const previous = reports[reports.length - 2];

    if (!current) {
      return {
        mrr: 0,
        arr: 0,
        totalCustomers: 0,
        arpu: 0,
        mrrGrowth: 0,
        customerGrowth: 0,
      };
    }

    const mrrGrowth = previous ? calculateGrowthRate(current.mrr, previous.mrr) : 0;
    const customerGrowth = previous
      ? calculateGrowthRate(
          current.new_customers - current.churned_customers,
          previous.new_customers - previous.churned_customers
        )
      : 0;

    return {
      mrr: current.mrr,
      arr: current.arr,
      totalCustomers: current.new_customers - current.churned_customers,
      arpu: current.average_revenue_per_user,
      mrrGrowth,
      customerGrowth,
    };
  };

  const exportRevenueData = () => {
    const csv = [
      ['Month', 'MRR', 'ARR', 'Total Revenue', 'New Customers', 'Churned Customers', 'ARPU'],
      ...reports.map((r) => [
        format(new Date(r.period_start), 'yyyy-MM'),
        r.mrr,
        r.arr,
        r.total_revenue,
        r.new_customers,
        r.churned_customers,
        r.average_revenue_per_user,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Revenue data exported');
  };

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

  const metrics = getCurrentMetrics();

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Revenue Analytics</h1>
            <p className="text-gray-600 mt-2">Track revenue, MRR, and financial performance</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3m">Last 3 months</SelectItem>
                <SelectItem value="6m">Last 6 months</SelectItem>
                <SelectItem value="12m">Last 12 months</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportRevenueData} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Monthly Recurring Revenue</p>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${metrics.mrr.toLocaleString()}</p>
            <div className="flex items-center gap-1 mt-2">
              {metrics.mrrGrowth > 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">+{metrics.mrrGrowth.toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{metrics.mrrGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-sm text-gray-500">vs last month</span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Annual Recurring Revenue</p>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${metrics.arr.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-2">Projected annual revenue</p>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Total Customers</p>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</p>
            <div className="flex items-center gap-1 mt-2">
              {metrics.customerGrowth > 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">
                    +{metrics.customerGrowth.toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">{metrics.customerGrowth.toFixed(1)}%</span>
                </>
              )}
              <span className="text-sm text-gray-500">growth</span>
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Average Revenue Per User</p>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">${metrics.arpu.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">Per month</p>
          </div>
        </Card>
      </div>

      {/* MRR Growth Chart */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">MRR Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Revenue by Plan & Customer Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue by Plan */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Revenue by Plan</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={planRevenue.filter((p) => p.revenue > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ plan, percent }) => `${plan} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {planRevenue.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Metrics */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Customer Metrics</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={growthMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#10B981"
                  name="New Customers"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="churn"
                  stroke="#EF4444"
                  name="Churned"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Revenue Reports Table */}
      <Card>
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Monthly Revenue Reports</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Subscription Revenue</TableHead>
                <TableHead>Refunds</TableHead>
                <TableHead>Net Revenue</TableHead>
                <TableHead>New Customers</TableHead>
                <TableHead>Churn</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports
                .slice()
                .reverse()
                .map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      {format(new Date(report.period_start), 'MMMM yyyy')}
                    </TableCell>
                    <TableCell>${report.total_revenue.toLocaleString()}</TableCell>
                    <TableCell>${report.subscription_revenue.toLocaleString()}</TableCell>
                    <TableCell className="text-red-600">
                      -${report.refunds.toLocaleString()}
                    </TableCell>
                    <TableCell className="font-semibold">
                      ${report.net_revenue.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">+{report.new_customers}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">-{report.churned_customers}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>

          {reports.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No revenue data available for the selected period
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
