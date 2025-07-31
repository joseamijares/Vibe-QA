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
} from 'recharts';
import {
  ArrowLeft,
  Activity,
  Users,
  Cpu,
  MemoryStick,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays, startOfDay } from 'date-fns';

interface SystemMetric {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  unit: string;
  recorded_at: string;
}

interface AggregatedMetric {
  date: string;
  cpu: number;
  memory: number;
  storage: number;
  activeUsers: number;
  apiCalls: number;
  feedbackCount: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function SuperadminMetrics() {
  const [, navigate] = useLocation();
  const { role, loading: permLoading } = usePermissions();
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!permLoading && role !== 'superadmin') {
      toast.error('Access denied. Superadmin only.');
      navigate('/dashboard');
    }
  }, [role, permLoading, navigate]);

  useEffect(() => {
    if (role === 'superadmin') {
      fetchMetrics();
      // Refresh metrics every 5 minutes
      const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [role, timeRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);

      // Calculate date range
      const daysAgo = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const startDate = startOfDay(subDays(new Date(), daysAgo));

      // Fetch system metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('system_metrics')
        .select('*')
        .gte('recorded_at', startDate.toISOString())
        .order('recorded_at', { ascending: false });

      if (metricsError) throw metricsError;

      setMetrics(metricsData || []);

      // Aggregate metrics by date for charts
      const aggregated = await aggregateMetricsByDate(metricsData || []);
      setAggregatedMetrics(aggregated);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const aggregateMetricsByDate = async (metrics: SystemMetric[]): Promise<AggregatedMetric[]> => {
    const grouped: { [key: string]: AggregatedMetric } = {};

    metrics.forEach((metric) => {
      const date = format(new Date(metric.recorded_at), 'MMM dd');

      if (!grouped[date]) {
        grouped[date] = {
          date,
          cpu: 0,
          memory: 0,
          storage: 0,
          activeUsers: 0,
          apiCalls: 0,
          feedbackCount: 0,
        };
      }

      switch (metric.metric_name) {
        case 'cpu_usage':
          grouped[date].cpu = Math.max(grouped[date].cpu, metric.metric_value);
          break;
        case 'memory_usage':
          grouped[date].memory = Math.max(grouped[date].memory, metric.metric_value);
          break;
        case 'storage_usage':
          grouped[date].storage = Math.max(grouped[date].storage, metric.metric_value);
          break;
        case 'active_users':
          grouped[date].activeUsers = Math.max(grouped[date].activeUsers, metric.metric_value);
          break;
        case 'api_calls':
          grouped[date].apiCalls += metric.metric_value;
          break;
        case 'feedback_submissions':
          grouped[date].feedbackCount += metric.metric_value;
          break;
      }
    });

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMetrics();
  };

  const getLatestMetric = (metricName: string): SystemMetric | undefined => {
    return metrics.find((m) => m.metric_name === metricName);
  };

  const getHealthStatus = () => {
    const cpu = getLatestMetric('cpu_usage');
    const memory = getLatestMetric('memory_usage');

    if (!cpu || !memory) return { status: 'unknown', color: 'gray' };

    if (cpu.metric_value > 90 || memory.metric_value > 90) {
      return { status: 'critical', color: 'red', icon: XCircle };
    }
    if (cpu.metric_value > 70 || memory.metric_value > 70) {
      return { status: 'warning', color: 'yellow', icon: AlertCircle };
    }
    return { status: 'healthy', color: 'green', icon: CheckCircle };
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

  const healthStatus = getHealthStatus();
  const StatusIcon = healthStatus.icon || Activity;

  // Prepare data for pie chart
  const storageData = [
    { name: 'Used', value: getLatestMetric('storage_usage')?.metric_value || 0 },
    { name: 'Free', value: 100 - (getLatestMetric('storage_usage')?.metric_value || 0) },
  ];

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
            <h1 className="text-3xl font-bold text-gray-900">System Metrics</h1>
            <p className="text-gray-600 mt-2">Monitor server performance and application health</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24h</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
              ) : (
                'Refresh'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* System Health Status */}
      <Card className={`mb-6 border-${healthStatus.color}-200 bg-${healthStatus.color}-50`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 text-${healthStatus.color}-600`} />
              <div>
                <h3 className="font-semibold text-lg">
                  System Health: {healthStatus.status.toUpperCase()}
                </h3>
                <p className="text-sm text-gray-600">
                  Last updated:{' '}
                  {metrics[0] ? format(new Date(metrics[0].recorded_at), 'PPp') : 'Never'}
                </p>
              </div>
            </div>
            <Badge variant={healthStatus.status === 'healthy' ? 'default' : 'destructive'}>
              {healthStatus.status}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLatestMetric('cpu_usage')?.metric_value.toFixed(1) || 0}%
                </p>
              </div>
              <Cpu className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLatestMetric('memory_usage')?.metric_value.toFixed(1) || 0}%
                </p>
              </div>
              <MemoryStick className="h-8 w-8 text-green-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLatestMetric('active_users')?.metric_value || 0}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">API Calls Today</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getLatestMetric('api_calls')?.metric_value || 0}
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* CPU & Memory Usage Chart */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Resource Usage Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={aggregatedMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cpu" stroke="#3B82F6" name="CPU %" strokeWidth={2} />
                <Line
                  type="monotone"
                  dataKey="memory"
                  stroke="#10B981"
                  name="Memory %"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Storage Usage Pie Chart */}
        <Card>
          <div className="p-6">
            <h3 className="font-semibold text-lg mb-4">Storage Usage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={storageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {storageData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="mb-8">
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Platform Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={aggregatedMetrics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="activeUsers"
                stackId="1"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                name="Active Users"
              />
              <Area
                type="monotone"
                dataKey="feedbackCount"
                stackId="1"
                stroke="#F59E0B"
                fill="#F59E0B"
                name="Feedback Submissions"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Recent Metrics Table */}
      <Card>
        <div className="p-6">
          <h3 className="font-semibold text-lg mb-4">Recent Metric Readings</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Recorded At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.slice(0, 10).map((metric) => (
                <TableRow key={metric.id}>
                  <TableCell className="font-medium">
                    {metric.metric_name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{metric.metric_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {metric.metric_value.toFixed(2)} {metric.unit}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(metric.recorded_at), 'PPp')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
