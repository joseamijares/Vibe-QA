import { Card } from '@/components/ui/card';

interface WidgetButtonPreviewProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  primaryColor?: string;
  buttonText?: string;
  showLauncher?: boolean;
}

export function WidgetButtonPreview({
  position = 'bottom-right',
  theme = 'auto',
  primaryColor = '#094765',
  buttonText = 'Feedback',
  showLauncher = true,
}: WidgetButtonPreviewProps) {
  // Determine the actual theme
  const actualTheme =
    theme === 'auto'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  // Position styles
  const positionStyles: Record<string, string> = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Theme-based styles
  const isDark = actualTheme === 'dark';
  const bgColor = isDark ? '#1f2937' : '#ffffff';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  if (!showLauncher) {
    return (
      <Card className="p-8 bg-gray-50 border-2 border-dashed">
        <p className="text-center text-gray-500 text-sm">
          Widget button is hidden. Enable "Show launcher button" to see preview.
        </p>
      </Card>
    );
  }

  return (
    <Card className="relative h-64 overflow-hidden" style={{ backgroundColor: bgColor }}>
      {/* Preview container */}
      <div className="absolute inset-0">
        {/* Simulated page content */}
        <div className="p-4 space-y-3">
          <div
            className="h-4 bg-gray-200 rounded w-3/4"
            style={{ backgroundColor: borderColor }}
          ></div>
          <div
            className="h-4 bg-gray-200 rounded w-full"
            style={{ backgroundColor: borderColor }}
          ></div>
          <div
            className="h-4 bg-gray-200 rounded w-5/6"
            style={{ backgroundColor: borderColor }}
          ></div>
        </div>

        {/* Widget button */}
        <div className={`absolute ${positionStyles[position]}`}>
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium text-sm shadow-lg transition-all hover:shadow-xl cursor-pointer"
            style={{
              backgroundColor: primaryColor,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
            }}
            disabled
          >
            {/* Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            {/* Text */}
            <span>{buttonText}</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
