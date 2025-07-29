import { Route, Switch, Redirect } from 'wouter';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectsPage } from '@/pages/dashboard/ProjectsPage';
import { NewProjectPage } from '@/pages/dashboard/NewProjectPage';
import { FeedbackPage } from '@/pages/dashboard/FeedbackPage';
import { TeamPage } from '@/pages/dashboard/TeamPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

// Wrapper components for protected routes
const ProtectedDashboard = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  </ProtectedRoute>
);

const ProtectedProjects = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <ProjectsPage />
    </DashboardLayout>
  </ProtectedRoute>
);

const ProtectedNewProject = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <NewProjectPage />
    </DashboardLayout>
  </ProtectedRoute>
);

const ProtectedFeedback = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <FeedbackPage />
    </DashboardLayout>
  </ProtectedRoute>
);

const ProtectedTeam = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <TeamPage />
    </DashboardLayout>
  </ProtectedRoute>
);

const ProtectedSettings = () => (
  <ProtectedRoute>
    <DashboardLayout>
      <SettingsPage />
    </DashboardLayout>
  </ProtectedRoute>
);

export function Routes() {
  return (
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

      {/* Catch-all route for 404 */}
      <Route>{() => <Redirect to="/dashboard" />}</Route>
    </Switch>
  );
}
