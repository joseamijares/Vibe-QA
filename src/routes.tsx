import { Route, Switch } from 'wouter';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectsPage } from '@/pages/dashboard/ProjectsPage';
import { FeedbackPage } from '@/pages/dashboard/FeedbackPage';
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

      {/* Protected routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardLayout>
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/dashboard/projects" component={ProjectsPage} />
              <Route path="/dashboard/feedback" component={FeedbackPage} />
              <Route path="/dashboard/settings" component={SettingsPage} />
            </Switch>
          </DashboardLayout>
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
