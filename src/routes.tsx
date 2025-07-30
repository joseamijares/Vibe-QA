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
  <ProtectedRoute requiredRole={['owner', 'admin']}>
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
  <ProtectedRoute requiredRole={['owner', 'admin']}>
    <Suspense fallback={<PageLoader />}>
      <DashboardLayout>
        <TeamPage />
      </DashboardLayout>
    </Suspense>
  </ProtectedRoute>
);

const ProtectedSettings = () => (
  <ProtectedRoute requiredRole={['owner', 'admin']}>
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

        {/* Protected dashboard routes */}
        <Route path="/dashboard" component={ProtectedDashboard} />
        <Route path="/dashboard/projects" component={ProtectedProjects} />
        <Route path="/dashboard/projects/new" component={ProtectedNewProject} />
        <Route path="/dashboard/feedback" component={ProtectedFeedback} />
        <Route path="/dashboard/team" component={ProtectedTeam} />
        <Route path="/dashboard/settings" component={ProtectedSettings} />
        <Route path="/dashboard/settings/billing" component={ProtectedBilling} />
      </Switch>
    </Suspense>
  );
}
