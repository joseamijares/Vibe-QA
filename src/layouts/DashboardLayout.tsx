import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { useFeedbackRealtimeSubscription } from '@/hooks/useFeedbackNotifications';
import { Button } from '@/components/ui/button';
import { NoOrganizationMessage } from '@/components/NoOrganizationMessage';
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
} from 'lucide-react';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { session, signOut } = useAuth();
  const { organization, membership, loading: orgLoading, error: orgError } = useOrganization();
  const { canManageProjects } = usePermissions();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Enable real-time feedback notifications
  useFeedbackRealtimeSubscription();

  // Show no organization message if user has no org
  if (!orgLoading && orgError && orgError.message.includes('No organization found')) {
    return <NoOrganizationMessage />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Projects', href: '/dashboard/projects', icon: Folder, show: true },
    { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare, show: true },
    { name: 'Team', href: '/dashboard/team', icon: Users, show: true },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, show: true },
  ].filter((item) => item.show);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo and org */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <Link href="/dashboard">
              <img
                src="/src/assets/vibe-code-logo.svg"
                alt="VibeQA"
                className="h-8 cursor-pointer"
              />
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Organization selector */}
          <div className="px-4 py-4 border-b">
            <button className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <span className="truncate">{organization?.name || 'Loading...'}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-4">
            {navigation.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive ? 'bg-[#094765] text-white' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User menu */}
          <div className="border-t px-4 py-4">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {session?.user?.email?.[0].toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <div className="truncate">{session?.user?.email}</div>
                  <div className="text-xs text-gray-500">{membership?.role}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border overflow-hidden z-20">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
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
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex-1" />

            {/* Quick actions */}
            <div className="flex items-center gap-4">
              {canManageProjects && (
                <Link href="/dashboard/projects/new">
                  <Button className="hidden sm:flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
