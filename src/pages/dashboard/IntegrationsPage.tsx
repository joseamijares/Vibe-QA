import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Code2, CheckSquare, Layers, MessageSquare, Hash } from 'lucide-react';

interface Integration {
  name: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const integrations: Integration[] = [
  {
    name: 'WhatsApp',
    icon: MessageCircle,
    description: 'Receive feedback directly through WhatsApp Business API',
    color: 'text-green-600',
  },
  {
    name: 'Jira',
    icon: Code2,
    description: 'Automatically create Jira tickets from feedback submissions',
    color: 'text-blue-600',
  },
  {
    name: 'Trello',
    icon: Layers,
    description: 'Create Trello cards from feedback for visual project management',
    color: 'text-blue-500',
  },
  {
    name: 'Asana',
    icon: CheckSquare,
    description: 'Sync feedback with Asana tasks for team collaboration',
    color: 'text-orange-600',
  },
  {
    name: 'SMS',
    icon: MessageSquare,
    description: 'Send and receive feedback via SMS for broader accessibility',
    color: 'text-purple-600',
  },
  {
    name: 'Slack',
    icon: Hash,
    description: 'Get real-time feedback notifications in your Slack channels',
    color: 'text-purple-700',
  },
];

export function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Integrations</h2>
        <p className="text-muted-foreground">
          Connect VibeQA with your favorite tools to streamline your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card
              key={integration.name}
              className="relative overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-gray-50 ${integration.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                  </div>
                  <Badge className="bg-gray-700 text-white border-gray-600 hover:bg-gray-800">
                    Coming Soon
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{integration.description}</CardDescription>
              </CardContent>
              <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-transparent opacity-0 hover:opacity-100 transition-opacity pointer-events-none" />
            </Card>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2">More integrations coming soon</h3>
        <p className="text-muted-foreground">
          We're constantly working on new integrations to make VibeQA work seamlessly with your
          existing tools. Have a specific integration request? Let us know through the feedback
          widget!
        </p>
      </div>
    </div>
  );
}
