import { useEffect, useState } from 'react';
import { Link, useParams } from 'wouter';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Project } from '@/types/database.types';
import { WidgetButtonPreview } from '@/components/WidgetButtonPreview';
import {
  ArrowLeft,
  Copy,
  Palette,
  Monitor,
  Moon,
  Sun,
  MapPin,
  Type,
  Code2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';

interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  buttonText: string;
  showLauncher: boolean;
}

export function WidgetConfigPage() {
  const { id } = useParams();
  const { organization } = useOrganization();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WidgetConfig>({
    position: 'bottom-right',
    theme: 'auto',
    primaryColor: '#094765',
    buttonText: 'Feedback',
    showLauncher: true,
  });
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  useEffect(() => {
    if (!organization || !id) return;
    fetchProject();
  }, [organization, id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .eq('organization_id', organization!.id)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const generateEmbedCode = () => {
    if (!project) return '';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const widgetUrl = `${supabaseUrl}/storage/v1/object/public/widget-assets/production/widget.js`;

    const dataAttributes = [
      `data-project-key="${project.api_key}"`,
      `data-api-url="${supabaseUrl}/functions/v1"`,
    ];

    if (config.position !== 'bottom-right') {
      dataAttributes.push(`data-position="${config.position}"`);
    }
    if (config.theme !== 'auto') {
      dataAttributes.push(`data-theme="${config.theme}"`);
    }
    if (config.primaryColor !== '#094765') {
      dataAttributes.push(`data-primary-color="${config.primaryColor}"`);
    }
    if (config.buttonText !== 'Feedback') {
      dataAttributes.push(`data-button-text="${config.buttonText}"`);
    }
    if (!config.showLauncher) {
      dataAttributes.push('data-show-launcher="false"');
    }

    return `<script 
  src="${widgetUrl}" 
  ${dataAttributes.join('\n  ')}
  async>
</script>`;
  };

  const generateAdvancedCode = () => {
    if (!project) return '';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const widgetUrl = `${supabaseUrl}/storage/v1/object/public/widget-assets/production/widget.js`;

    return `<script>
window.vibeQAConfig = {
  projectKey: '${project.api_key}',
  apiUrl: '${supabaseUrl}/functions/v1',
  position: '${config.position}',
  theme: '${config.theme}',
  primaryColor: '${config.primaryColor}',
  buttonText: '${config.buttonText}',
  showLauncher: ${config.showLauncher},
  
  // Optional user identification
  user: {
    id: 'user123',
    email: 'user@example.com',
    name: 'John Doe'
  },
  
  // Optional metadata
  metadata: {
    page: window.location.pathname,
    version: '1.0.0',
    // Add any custom data
  },
  
  // Optional callbacks
  onSuccess: function(feedbackId) {
    console.log('Feedback submitted:', feedbackId);
  },
  onError: function(error) {
    console.error('Feedback error:', error);
  },
  onOpen: function() {
    console.log('Widget opened');
  },
  onClose: function() {
    console.log('Widget closed');
  }
};
</script>
<script src="${widgetUrl}" async></script>`;
  };

  const copyCode = (advanced = false) => {
    const code = advanced ? generateAdvancedCode() : generateEmbedCode();
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedCode(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#094765] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading widget configuration...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Project not found</p>
        <Link href="/dashboard/projects">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/projects/${project.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Widget Configuration</h1>
            <p className="text-gray-600 mt-1">{project.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Configuration */}
        <div className="space-y-6">
          {/* Appearance Settings */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </h2>

            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'bottom-right', icon: MapPin, label: 'Bottom Right' },
                    { value: 'bottom-left', icon: MapPin, label: 'Bottom Left' },
                    { value: 'top-right', icon: MapPin, label: 'Top Right' },
                    { value: 'top-left', icon: MapPin, label: 'Top Left' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setConfig({ ...config, position: option.value as any })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        config.position === option.value
                          ? 'border-[#094765] bg-[#094765]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option.icon className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'auto', icon: Monitor, label: 'Auto' },
                    { value: 'light', icon: Sun, label: 'Light' },
                    { value: 'dark', icon: Moon, label: 'Dark' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setConfig({ ...config, theme: option.value as any })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        config.theme === option.value
                          ? 'border-[#094765] bg-[#094765]/5'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <option.icon className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-xs">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={config.primaryColor}
                    onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="#094765"
                  />
                </div>
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Type className="h-4 w-4 inline mr-1" />
                  Button Text
                </label>
                <input
                  type="text"
                  value={config.buttonText}
                  onChange={(e) => setConfig({ ...config, buttonText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Feedback"
                />
              </div>

              {/* Show Launcher */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showLauncher}
                    onChange={(e) => setConfig({ ...config, showLauncher: e.target.checked })}
                    className="w-4 h-4 text-[#094765] rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    {config.showLauncher ? (
                      <>
                        <Eye className="h-4 w-4 inline mr-1" />
                        Show launcher button
                      </>
                    ) : (
                      <>
                        <EyeOff className="h-4 w-4 inline mr-1" />
                        Hide launcher button
                      </>
                    )}
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  When hidden, you'll need to trigger the widget programmatically
                </p>
              </div>
            </div>
          </Card>

          {/* Integration Methods */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Integration Methods
            </h2>

            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('basic')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  activeTab === 'basic'
                    ? 'border-[#094765] bg-[#094765]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium">Basic Installation</h3>
                <p className="text-sm text-gray-600 mt-1">Simple script tag with data attributes</p>
              </button>

              <button
                onClick={() => setActiveTab('advanced')}
                className={`w-full text-left p-4 rounded-lg border-2 transition-colors ${
                  activeTab === 'advanced'
                    ? 'border-[#094765] bg-[#094765]/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <h3 className="font-medium">Advanced Configuration</h3>
                <p className="text-sm text-gray-600 mt-1">
                  JavaScript configuration with callbacks and user data
                </p>
              </button>
            </div>
          </Card>
        </div>

        {/* Right Column - Code Output */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {activeTab === 'basic' ? 'Installation Code' : 'Advanced Configuration'}
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyCode(activeTab === 'advanced')}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copiedCode ? 'Copied!' : 'Copy'}
              </Button>
            </div>

            <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
              {activeTab === 'basic' ? generateEmbedCode() : generateAdvancedCode()}
            </pre>
          </Card>

          {/* API Methods */}
          {activeTab === 'advanced' && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Available Methods</h3>
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="font-mono">window.VibeQA.widget.open()</code>
                  <p className="text-gray-600 mt-1">Opens the feedback widget</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="font-mono">window.VibeQA.widget.close()</code>
                  <p className="text-gray-600 mt-1">Closes the feedback widget</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="font-mono">window.VibeQA.widget.toggle()</code>
                  <p className="text-gray-600 mt-1">Toggles the widget open/closed</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="font-mono">window.VibeQA.widget.destroy()</code>
                  <p className="text-gray-600 mt-1">Removes the widget from the page</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="font-mono">window.VibeQA.setUser(userData)</code>
                  <p className="text-gray-600 mt-1">Updates user information</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <code className="font-mono">window.VibeQA.setMetadata(metadata)</code>
                  <p className="text-gray-600 mt-1">Updates custom metadata</p>
                </div>
              </div>
            </Card>
          )}

          {/* Tips */}
          <Card className="p-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">Pro Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Test the widget in your staging environment first</li>
              <li>• Use the advanced configuration to identify logged-in users</li>
              <li>• Add custom metadata to categorize feedback by page or feature</li>
              <li>• Use callbacks to track widget usage in your analytics</li>
              <li>• The widget automatically adapts to mobile devices</li>
            </ul>
          </Card>

          {/* Live Preview */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
            <p className="text-sm text-gray-600 mb-4">
              This is how your feedback button will appear on your website
            </p>
            <WidgetButtonPreview
              position={config.position}
              theme={config.theme}
              primaryColor={config.primaryColor}
              buttonText={config.buttonText}
              showLauncher={config.showLauncher}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
