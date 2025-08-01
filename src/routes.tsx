import { lazy, Suspense } from 'react';
import { Route, Switch } from 'wouter';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Lazy load pages for better performance
const LandingPage = lazy(() =>
  import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage }))
);
const LoginPage = lazy(() =>
  import('@/pages/auth/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('@/pages/auth/RegisterPage').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('@/pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage }))
);
const AcceptInvitationPage = lazy(() =>
  import('@/pages/auth/AcceptInvitationPage').then((m) => ({ default: m.AcceptInvitationPage }))
);
const DashboardLayout = lazy(() =>
  import('@/layouts/DashboardLayout').then((m) => ({ default: m.DashboardLayout }))
);
const DashboardPage = lazy(() =>
  import('@/pages/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const ProjectsPage = lazy(() =>
  import('@/pages/dashboard/ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
const NewProjectPage = lazy(() =>
  import('@/pages/dashboard/NewProjectPage').then((m) => ({ default: m.NewProjectPage }))
);
const FeedbackPage = lazy(() =>
  import('@/pages/dashboard/FeedbackPage').then((m) => ({ default: m.FeedbackPage }))
);
const TeamPage = lazy(() =>
  import('@/pages/dashboard/TeamPage').then((m) => ({ default: m.TeamPage }))
);
const SettingsPage = lazy(() =>
  import('@/pages/dashboard/SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
const BillingPage = lazy(() =>
  import('@/pages/settings/BillingPage').then((m) => ({ default: m.BillingPage }))
);
const ProjectDetailPage = lazy(() =>
  import('@/pages/dashboard/ProjectDetailPage').then((m) => ({ default: m.ProjectDetailPage }))
);
const WidgetConfigPage = lazy(() =>
  import('@/pages/dashboard/WidgetConfigPage').then((m) => ({ default: m.WidgetConfigPage }))
);
const AnalyticsPage = lazy(() =>
  import('@/pages/dashboard/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage }))
);
const EditProjectPage = lazy(() =>
  import('@/pages/dashboard/EditProjectPage').then((m) => ({ default: m.EditProjectPage }))
);
const TrialExpiredPage = lazy(() =>
  import('@/pages/TrialExpiredPage').then((m) => ({ default: m.TrialExpiredPage }))
);

// Superadmin pages
const SuperadminDashboard = lazy(() =>
  import('@/pages/dashboard/superadmin/SuperadminDashboard').then((m) => ({
    default: m.SuperadminDashboard,
  }))
);
const SuperadminUsers = lazy(() =>
  import('@/pages/dashboard/superadmin/SuperadminUsers').then((m) => ({
    default: m.SuperadminUsers,
  }))
);
const SuperadminSubscriptions = lazy(() =>
  import('@/pages/dashboard/superadmin/SuperadminSubscriptions').then((m) => ({
    default: m.SuperadminSubscriptions,
  }))
);
const SuperadminCoupons = lazy(() =>
  import('@/pages/dashboard/superadmin/SuperadminCoupons').then((m) => ({
    default: m.SuperadminCoupons,
  }))
);
const SuperadminMetrics = lazy(() =>
  import('@/pages/dashboard/superadmin/SuperadminMetrics').then((m) => ({
    default: m.SuperadminMetrics,
  }))
);
const SuperadminRevenue = lazy(() =>
  import('@/pages/dashboard/superadmin/SuperadminRevenue').then((m) => ({
    default: m.SuperadminRevenue,
  }))
);

// Loading component
const PageLoader = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
  </div>
);

// Wrapper components for protected routes with Suspense
const ProtectedDashboard = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <DashboardPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedProjects = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <ProjectsPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedNewProject = () => (
  <ProtectedRoute requiredRole={['owner']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <NewProjectPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedFeedback = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <FeedbackPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedTeam = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <TeamPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedAnalytics = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <AnalyticsPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedSettings = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <SettingsPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedBilling = () => (
  <ProtectedRoute requiredRole={['owner']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <BillingPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedProjectDetail = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <ProjectDetailPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedWidgetConfig = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <WidgetConfigPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedEditProject = () => (
  <ProtectedRoute>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <EditProjectPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

// Superadmin protected routes
const ProtectedSuperadminDashboard = () => (
  <ProtectedRoute requiredRole={['superadmin']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <SuperadminDashboard />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedSuperadminUsers = () => (
  <ProtectedRoute requiredRole={['superadmin']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <SuperadminUsers />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedSuperadminSubscriptions = () => (
  <ProtectedRoute requiredRole={['superadmin']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <SuperadminSubscriptions />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedSuperadminCoupons = () => (
  <ProtectedRoute requiredRole={['superadmin']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <SuperadminCoupons />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedSuperadminMetrics = () => (
  <ProtectedRoute requiredRole={['superadmin']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <SuperadminMetrics />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedSuperadminRevenue = () => (
  <ProtectedRoute requiredRole={['superadmin']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <SuperadminRevenue />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

export function Routes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Public routes */}
        <Route path="/" component={LandingPage} />
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/accept-invitation/:id" component={AcceptInvitationPage} />
        <Route path="/trial-expired" component={TrialExpiredPage} />

        {/* Protected dashboard routes */}
        <Route path="/dashboard" component={ProtectedDashboard} />
        <Route path="/dashboard/projects" component={ProtectedProjects} />
        <Route path="/dashboard/projects/new" component={ProtectedNewProject} />
        <Route path="/dashboard/projects/:id" component={ProtectedProjectDetail} />
        <Route path="/dashboard/projects/:id/edit" component={ProtectedEditProject} />
        <Route path="/dashboard/projects/:id/widget" component={ProtectedWidgetConfig} />
        <Route path="/dashboard/feedback" component={ProtectedFeedback} />
        <Route path="/dashboard/analytics" component={ProtectedAnalytics} />
        <Route path="/dashboard/team" component={ProtectedTeam} />
        <Route path="/dashboard/settings" component={ProtectedSettings} />
        <Route path="/dashboard/settings/billing" component={ProtectedBilling} />

        {/* Superadmin routes */}
        <Route path="/dashboard/superadmin" component={ProtectedSuperadminDashboard} />
        <Route path="/dashboard/superadmin/users" component={ProtectedSuperadminUsers} />
        <Route
          path="/dashboard/superadmin/subscriptions"
          component={ProtectedSuperadminSubscriptions}
        />
        <Route path="/dashboard/superadmin/coupons" component={ProtectedSuperadminCoupons} />
        <Route path="/dashboard/superadmin/metrics" component={ProtectedSuperadminMetrics} />
        <Route path="/dashboard/superadmin/revenue" component={ProtectedSuperadminRevenue} />
      </Switch>
    </Suspense>
  );
}
