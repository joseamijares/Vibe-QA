import { Link, useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { useOrganization } from '@/hooks/useOrganization';
import { usePermissions } from '@/hooks/usePermissions';
import { Building2, CreditCard, Users, Bell, Key, Shield, ChevronRight } from 'lucide-react';

export function SettingsPage() {
  const [location] = useLocation();
  const { organization } = useOrganization();
  const { canManageBilling, canManageOrganization, canManageTeam } = usePermissions();

  const settingsSections = [
    {
      title: 'Organization',
      description: 'Manage your organization details and preferences',
      icon: Building2,
      href: '/dashboard/settings/organization',
      show: canManageOrganization,
    },
    {
      title: 'Billing & Subscription',
      description: 'Manage your subscription plan and payment methods',
      icon: CreditCard,
      href: '/dashboard/settings/billing',
      show: canManageBilling,
    },
    {
      title: 'Team Members',
      description: 'Manage team members and their roles',
      icon: Users,
      href: '/dashboard/team',
      show: canManageTeam,
    },
    {
      title: 'Notifications',
      description: 'Configure how you receive notifications',
      icon: Bell,
      href: '/dashboard/settings/notifications',
      show: true,
    },
    {
      title: 'API Keys',
      description: 'Manage API keys and developer settings',
      icon: Key,
      href: '/dashboard/settings/api',
      show: canManageOrganization,
    },
    {
      title: 'Security',
      description: 'Security settings and two-factor authentication',
      icon: Shield,
      href: '/dashboard/settings/security',
      show: true,
    },
  ].filter((section) => section.show);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your organization and account settings</p>
      </div>

      {/* Organization info */}
      {organization && (
        <Card className="p-6">
          <div className="flex items-center gap-4">
            {organization.logo_url ? (
              <img
                src={organization.logo_url}
                alt={organization.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold">{organization.name}</h2>
              <p className="text-muted-foreground">Organization ID: {organization.id}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Settings sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          const isActive = location === section.href;

          return (
            <Link key={section.href} href={section.href}>
              <Card
                className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
