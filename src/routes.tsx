import { Route, Switch } from 'wouter';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { AcceptInvitationPage } from '@/pages/auth/AcceptInvitationPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectsPage } from '@/pages/dashboard/ProjectsPage';
import { FeedbackPage } from '@/pages/dashboard/FeedbackPage';
import { TeamPage } from '@/pages/dashboard/TeamPage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { ProtectedRoute } from '@/components/ProtectedRoute';

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
      <Route path="/dashboard">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard/projects">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <ProjectsPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard/feedback">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <FeedbackPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard/team">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <TeamPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>

      <Route path="/dashboard/settings">
        {() => (
          <ProtectedRoute>
            <DashboardLayout>
              <SettingsPage />
            </DashboardLayout>
          </ProtectedRoute>
        )}
      </Route>
    </Switch>
  );
}
