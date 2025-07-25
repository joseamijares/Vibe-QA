import { Link } from 'wouter';
import { AnimatedBackground, FloatingElements } from '@/components/AnimatedBackground';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <AnimatedBackground variant="orbs" />

      <div className="relative z-10 min-h-screen flex">
        {/* Left side - Auth form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link href="/">
                <img
                  src="/src/assets/vibe-code-logo.svg"
                  alt="VibeQA"
                  className="h-12 mx-auto mb-8 cursor-pointer hover:opacity-80 transition-opacity"
                />
              </Link>
              <h1 className="text-4xl font-bold mb-2">{title}</h1>
              <p className="text-gray-600">{subtitle}</p>
            </div>

            <div className="glass-modern-light rounded-2xl p-8 shadow-xl">{children}</div>
          </div>
        </div>

        {/* Right side - Feature showcase */}
        <div className="hidden lg:flex flex-1 bg-gradient-to-br from-[#094765] via-[#156c8b] to-[#3387a7] items-center justify-center px-12 relative">
          <FloatingElements />

          <div className="relative z-10 text-white max-w-lg">
            <h2 className="text-3xl font-bold mb-6">QA feedback that developers love</h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl glass-modern flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Lightning Fast Setup</h3>
                  <p className="text-white/80">
                    Add one line of code and start collecting feedback in seconds
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl glass-modern flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Built for Teams</h3>
                  <p className="text-white/80">
                    Collaborate seamlessly with your entire development team
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl glass-modern flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Enterprise Security</h3>
                  <p className="text-white/80">Bank-level encryption and SOC 2 compliance</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 glass-modern rounded-xl">
              <div className="flex items-center gap-4 mb-2">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FFB39A]"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3387a7] to-[#66a5bd]"></div>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#094765] to-[#156c8b]"></div>
                </div>
                <div className="text-sm">
                  <p className="font-semibold">Join 500+ teams</p>
                  <p className="text-white/80">who ship better software</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
