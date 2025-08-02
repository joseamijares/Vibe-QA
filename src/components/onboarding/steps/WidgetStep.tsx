import { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Code2, Copy, Check, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WidgetStepProps {
  onNext: () => void;
  hasProject: boolean;
}

export function WidgetStep({ onNext, hasProject }: WidgetStepProps) {
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (organization && hasProject) {
      fetchLatestProject();
    } else {
      setLoading(false);
    }
  }, [organization, hasProject]);

  const fetchLatestProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('organization_id', organization!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmbedCode = () => {
    if (!project) return '';

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionsUrl = `${supabaseUrl}/functions/v1`;

    return `<script 
  src="${supabaseUrl}/storage/v1/object/public/widget-assets/production/widget.js" 
  data-project-key="${project.api_key}"
  data-api-url="${functionsUrl}"
  async>
</script>`;
  };

  const handleCopy = async () => {
    const code = getEmbedCode();
    await navigator.clipboard.writeText(code);
    setCopied(true);
    toast({
      title: 'Copied!',
      description: 'Widget code copied to clipboard',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasProject) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center mx-auto shadow-lg">
            <Code2 className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">Widget Integration</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Create a project first to get your widget embed code. You can always come back to this
            later!
          </p>
        </div>

        <Button onClick={onNext} className="w-full magnetic-button">
          Continue
        </Button>
      </div>
    );
  }

  const embedCode = getEmbedCode();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-gradient-to-br from-[#094765] to-[#3387a7] rounded-full flex items-center justify-center mx-auto shadow-lg">
          <Code2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Embed the Widget</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Add this code to your website to start collecting feedback. It's that simple!
        </p>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto"></div>
        </div>
      ) : embedCode ? (
        <div className="space-y-4">
          <Card className="p-4 bg-gray-50">
            <div className="flex items-start justify-between gap-4">
              <pre className="text-sm overflow-x-auto flex-1">
                <code className="language-html">{embedCode}</code>
              </pre>
              <Button size="sm" variant="outline" onClick={handleCopy} className="flex-shrink-0">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </Card>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-900 mb-2">Quick Integration Tips:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Add the code just before the closing &lt;/body&gt; tag</li>
              <li>• The widget loads asynchronously and won't block your page</li>
              <li>• Customize appearance in your project settings</li>
              <li>• Test in development before deploying to production</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <a
              href="/dashboard/projects"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#094765] hover:text-[#156c8b] transition-colors"
            >
              View full integration guide
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600">
          <p>No project found. Please create a project first.</p>
        </div>
      )}

      <Button onClick={onNext} className="w-full magnetic-button">
        Continue
      </Button>
    </div>
  );
}
