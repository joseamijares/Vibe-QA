import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useFeedbackRealtimeSubscription } from '@/hooks/useFeedbackNotifications';
import { useTrialBlock } from '@/hooks/useTrialStatus';
import { Button } from '@/components/ui/button';
import { NoOrganizationMessage } from '@/components/NoOrganizationMessage';
import { AsyncErrorBoundary } from '@/components/AsyncErrorBoundary';
import { TrialBanner } from '@/components/TrialBanner';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';
import {
  LayoutDashboard,
  Folder,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Menu,
  X,
  Shield,
  BarChart3,
  Plug,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import logoSvg from '@/assets/vibe-code-logo.svg';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location, navigate] = useLocation();
  const { session, signOut } = useAuth();
  const { organization, membership, loading: orgLoading, error: orgError } = useOrganization();
  const { canManageProjects, role } = usePermissions();
  const { isBlocked, trialStatus } = useTrialBlock();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Enable real-time feedback notifications
  useFeedbackRealtimeSubscription();

  // Check if trial has expired and redirect accordingly
  useEffect(() => {
    console.log('[DashboardLayout] Trial check:', {
      isBlocked,
      isLoading: trialStatus.isLoading,
      trialStatus: trialStatus.trialStatus,
      location,
    });

    if (isBlocked && !trialStatus.isLoading) {
      // Allow access to billing page even if trial expired
      if (!location.includes('/dashboard/settings/billing')) {
        console.log('[DashboardLayout] Redirecting to trial-expired page');
        navigate('/trial-expired');
      }
    }
  }, [isBlocked, trialStatus.isLoading, location, navigate]);

  // Show no organization message if user has no org
  if (!orgLoading && orgError && orgError.message.includes('No organization found')) {
    return <NoOrganizationMessage />;
  }

  // The redirect is handled in useEffect above
  if (isBlocked && !location.includes('/dashboard/settings/billing')) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder, show: true },
    { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare, show: true },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, show: true },
    { name: 'Integrations', href: '/dashboard/integrations', icon: Plug, show: true },
    { name: 'Team', href: '/dashboard/team', icon: Users, show: true },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, show: true },
    {
      name: 'Superadmin',
      href: '/dashboard/superadmin',
      icon: Shield,
      show: role === 'superadmin',
    },
  ].filter((item) => item.show);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <>
      {/* Onboarding Modal */}
      <OnboardingModal />

      <div className="min-h-screen lg:flex relative">
        {/* Dashboard background with subtle aurora */}
        <div className="dashboard-bg" />
        <div className="dashboard-aurora">
          <div className="dashboard-aurora-1" />
          <div className="dashboard-aurora-2" />
        </div>

        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar with glassmorphism */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 glass-sidebar transform transition-transform lg:translate-x-0 lg:static lg:block lg:h-screen ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Logo and org */}
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100/20">
              <Link href="/dashboard">
                <img src={logoSvg} alt="VibeQA" className="h-8 cursor-pointer" />
              </Link>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Organization selector */}
            <div className="px-4 py-4 border-b border-gray-100/20">
              <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 glass-dashboard-dark rounded-xl hover:bg-gray-50/50 transition-all">
                <span className="truncate font-semibold">{organization?.name || 'Loading...'}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1.5 px-4 py-4">
              {navigation.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? location === '/dashboard'
                    : location === item.href || location.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`nav-item-dashboard flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${
                      isActive
                        ? 'active shadow-lg'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50/50'
                    }`}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : ''}`} />
                    <span className={isActive ? 'text-white' : ''}>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="border-t border-gray-100/20 px-4 py-4">
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-full flex items-center gap-3 px-3 py-3 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50/50 transition-all"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-md">
                    {session?.user?.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="truncate font-medium">{session?.user?.email}</div>
                    <div className="text-xs text-gray-500 capitalize">{membership?.role}</div>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute bottom-full left-0 right-0 mb-2 glass-card-dashboard rounded-xl overflow-hidden z-20">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-red-50/50 hover:text-red-600 transition-all"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 relative">
          {/* Top bar with glassmorphism */}
          <header className="glass-dashboard border-b border-gray-100/20 sticky top-0 z-30">
            <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="flex-1" />

              {/* Quick actions */}
              <div className="flex items-center gap-4">
                {canManageProjects && (
                  <Link href="/dashboard/projects/new">
                    <Button className="hidden sm:flex items-center gap-2 btn-dashboard-primary rounded-full px-6">
                      <Plus className="h-4 w-4" />
                      New Project
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </header>

          {/* Trial Banner */}
          <TrialBanner />

          {/* Page content */}
          <main className="flex-1">
            <div className="py-6 px-4 sm:px-6 lg:px-8">
              <AsyncErrorBoundary>{children}</AsyncErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
