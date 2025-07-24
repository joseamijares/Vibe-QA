export const HeroMockup = () => (
  <svg viewBox="0 0 800 600" className="w-full h-full">
    {/* Browser window frame */}
    <rect
      x="0"
      y="0"
      width="800"
      height="600"
      rx="8"
      fill="#f8fafc"
      stroke="#e2e8f0"
      strokeWidth="1"
    />

    {/* Browser toolbar */}
    <rect x="0" y="0" width="800" height="40" rx="8" fill="#ffffff" />
    <circle cx="20" cy="20" r="5" fill="#ef4444" />
    <circle cx="40" cy="20" r="5" fill="#eab308" />
    <circle cx="60" cy="20" r="5" fill="#22c55e" />

    {/* URL bar */}
    <rect x="100" y="10" width="600" height="20" rx="4" fill="#f3f4f6" />
    <text x="110" y="24" fill="#6b7280" fontSize="12" fontFamily="monospace">
      https://app.example.com?qa=on
    </text>

    {/* Page content */}
    <rect x="40" y="80" width="200" height="20" rx="4" fill="#e5e7eb" />
    <rect x="40" y="120" width="720" height="60" rx="4" fill="#f3f4f6" />
    <rect x="40" y="200" width="340" height="140" rx="4" fill="#f3f4f6" />
    <rect x="420" y="200" width="340" height="140" rx="4" fill="#f3f4f6" />

    {/* VibeQA Widget Button */}
    <g transform="translate(720, 520)">
      <circle cx="0" cy="0" r="30" fill="#156C8B" className="drop-shadow-lg" />
      <path d="M -10 -10 L 10 -10 L 0 10 Z" fill="white" />
      <circle cx="-8" cy="-8" r="3" fill="white" />
      <circle cx="8" cy="-8" r="3" fill="white" />
    </g>

    {/* Annotation overlay */}
    <g opacity="0.8">
      <rect
        x="420"
        y="200"
        width="340"
        height="140"
        fill="none"
        stroke="#ef4444"
        strokeWidth="3"
        strokeDasharray="5,5"
      />
      <circle cx="590" cy="270" r="40" fill="none" stroke="#ef4444" strokeWidth="3" />
      <path d="M 630 270 L 680 250" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrowhead)" />
      <text x="690" y="250" fill="#ef4444" fontSize="16" fontWeight="bold">
        Bug here!
      </text>
    </g>

    {/* Arrow marker */}
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
      </marker>
    </defs>

    {/* Feedback panel */}
    <g transform="translate(500, 350)">
      <rect
        x="0"
        y="0"
        width="280"
        height="200"
        rx="8"
        fill="white"
        stroke="#e5e7eb"
        strokeWidth="1"
        className="drop-shadow-xl"
      />
      <text x="20" y="30" fontSize="16" fontWeight="bold" fill="#111827">
        Report a Bug
      </text>
      <rect x="20" y="50" width="240" height="80" rx="4" fill="#f9fafb" stroke="#e5e7eb" />
      <text x="30" y="70" fontSize="14" fill="#6b7280">
        The submit button doesn't work when...
      </text>
      <rect x="20" y="150" width="100" height="30" rx="4" fill="#156C8B" />
      <text x="50" y="170" fontSize="14" fill="white" fontWeight="medium">
        Send
      </text>
    </g>
  </svg>
);

export const DashboardMockup = () => (
  <svg viewBox="0 0 800 600" className="w-full h-full">
    {/* Dashboard background */}
    <rect x="0" y="0" width="800" height="600" rx="8" fill="#0a1929" />

    {/* Sidebar */}
    <rect x="0" y="0" width="200" height="600" fill="#0f2744" />
    <text x="20" y="40" fontSize="20" fontWeight="bold" fill="#ffffff">
      VibeQA
    </text>

    {/* Menu items */}
    <rect x="0" y="80" width="200" height="40" fill="#156C8B" />
    <text x="20" y="105" fontSize="14" fill="#ffffff">
      Dashboard
    </text>

    <text x="20" y="145" fontSize="14" fill="#94a3b8">
      Projects
    </text>
    <text x="20" y="185" fontSize="14" fill="#94a3b8">
      Bug Reports
    </text>
    <text x="20" y="225" fontSize="14" fill="#94a3b8">
      Team
    </text>

    {/* Main content area */}
    <text x="240" y="60" fontSize="24" fontWeight="bold" fill="#ffffff">
      Dashboard Overview
    </text>

    {/* Stats cards */}
    <g transform="translate(240, 100)">
      <rect x="0" y="0" width="160" height="100" rx="8" fill="#1e3a5f" />
      <text x="20" y="30" fontSize="14" fill="#94a3b8">
        Active Bugs
      </text>
      <text x="20" y="60" fontSize="32" fontWeight="bold" fill="#ffffff">
        42
      </text>
      <text x="20" y="80" fontSize="12" fill="#10b981">
        +12% this week
      </text>
    </g>

    <g transform="translate(420, 100)">
      <rect x="0" y="0" width="160" height="100" rx="8" fill="#1e3a5f" />
      <text x="20" y="30" fontSize="14" fill="#94a3b8">
        Resolved
      </text>
      <text x="20" y="60" fontSize="32" fontWeight="bold" fill="#ffffff">
        128
      </text>
      <text x="20" y="80" fontSize="12" fill="#10b981">
        +8% this week
      </text>
    </g>

    <g transform="translate(600, 100)">
      <rect x="0" y="0" width="160" height="100" rx="8" fill="#1e3a5f" />
      <text x="20" y="30" fontSize="14" fill="#94a3b8">
        Avg Resolution
      </text>
      <text x="20" y="60" fontSize="32" fontWeight="bold" fill="#ffffff">
        2.4h
      </text>
      <text x="20" y="80" fontSize="12" fill="#ef4444">
        -15% slower
      </text>
    </g>

    {/* Chart area */}
    <rect x="240" y="240" width="520" height="200" rx="8" fill="#1e3a5f" />
    <text x="260" y="270" fontSize="16" fontWeight="bold" fill="#ffffff">
      Bug Reports Trend
    </text>

    {/* Simple line chart */}
    <polyline
      points="300,380 350,360 400,370 450,340 500,320 550,330 600,310 650,320 700,300"
      fill="none"
      stroke="#3b82f6"
      strokeWidth="2"
    />
    <polyline
      points="300,380 350,370 400,375 450,360 500,350 550,355 600,340 650,345 700,330"
      fill="none"
      stroke="#10b981"
      strokeWidth="2"
    />

    {/* Recent bugs list */}
    <rect x="240" y="460" width="520" height="120" rx="8" fill="#1e3a5f" />
    <text x="260" y="490" fontSize="16" fontWeight="bold" fill="#ffffff">
      Recent Bug Reports
    </text>

    <g transform="translate(260, 510)">
      <circle cx="10" cy="10" r="4" fill="#ef4444" />
      <text x="25" y="10" fontSize="12" fill="#ffffff">
        Login button not responding on mobile
      </text>
      <text x="25" y="25" fontSize="11" fill="#64748b">
        2 minutes ago • High Priority
      </text>
    </g>

    <g transform="translate(260, 540)">
      <circle cx="10" cy="10" r="4" fill="#eab308" />
      <text x="25" y="10" fontSize="12" fill="#ffffff">
        Styling issue on checkout page
      </text>
      <text x="25" y="25" fontSize="11" fill="#64748b">
        15 minutes ago • Medium Priority
      </text>
    </g>
  </svg>
);

export const FeatureMockup = ({
  type,
}: {
  type: 'screenshot' | 'console' | 'browser' | 'recording';
}) => {
  if (type === 'screenshot') {
    return (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        <rect x="0" y="0" width="200" height="150" rx="4" fill="#f8fafc" />
        <rect x="20" y="20" width="160" height="110" rx="2" fill="#e5e7eb" />
        <circle cx="100" cy="75" r="30" fill="none" stroke="#ef4444" strokeWidth="2" />
        <path d="M 130 75 L 160 60" stroke="#ef4444" strokeWidth="2" />
        <rect x="10" y="10" width="40" height="20" rx="2" fill="#156C8B" opacity="0.8" />
        <text x="30" y="24" fontSize="10" fill="white" textAnchor="middle">
          Draw
        </text>
      </svg>
    );
  }

  if (type === 'console') {
    return (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        <rect x="0" y="0" width="200" height="150" rx="4" fill="#1e293b" />
        <text x="10" y="20" fontSize="10" fill="#ef4444" fontFamily="monospace">
          Error: Cannot read property
        </text>
        <text x="10" y="35" fontSize="10" fill="#94a3b8" fontFamily="monospace">
          {' '}
          at Object.handleClick
        </text>
        <text x="10" y="50" fontSize="10" fill="#94a3b8" fontFamily="monospace">
          {' '}
          at HTMLElement.dispatch
        </text>
        <text x="10" y="70" fontSize="10" fill="#eab308" fontFamily="monospace">
          Warning: setState(...)
        </text>
        <text x="10" y="90" fontSize="10" fill="#3b82f6" fontFamily="monospace">
          Info: API call completed
        </text>
      </svg>
    );
  }

  if (type === 'browser') {
    return (
      <svg viewBox="0 0 200 150" className="w-full h-full">
        <rect x="0" y="0" width="200" height="150" rx="4" fill="#f8fafc" />
        <text x="10" y="25" fontSize="12" fontWeight="bold" fill="#374151">
          Browser Info
        </text>
        <text x="10" y="45" fontSize="10" fill="#6b7280">
          Chrome 119.0.0
        </text>
        <text x="10" y="60" fontSize="10" fill="#6b7280">
          macOS 14.1
        </text>
        <text x="10" y="75" fontSize="10" fill="#6b7280">
          1920 x 1080
        </text>
        <text x="10" y="90" fontSize="10" fill="#6b7280">
          Device: Desktop
        </text>
        <text x="10" y="105" fontSize="10" fill="#6b7280">
          Language: en-US
        </text>
        <text x="10" y="120" fontSize="10" fill="#6b7280">
          Timezone: PST
        </text>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 150" className="w-full h-full">
      <rect x="0" y="0" width="200" height="150" rx="4" fill="#f8fafc" />
      <circle cx="100" cy="75" r="30" fill="#ef4444" opacity="0.2" />
      <rect x="85" y="60" width="30" height="30" rx="2" fill="#ef4444" />
      <path d="M 95 70 L 95 80 L 105 75 Z" fill="white" />
      <text x="100" y="120" fontSize="10" fill="#6b7280" textAnchor="middle">
        Click to record
      </text>
    </svg>
  );
};
