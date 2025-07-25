import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface SocialAuthButtonsProps {
  onGoogleSignIn: () => Promise<void>;
  onMagicLinkSignIn: (email: string) => Promise<void>;
  isLoading?: boolean;
}

export function SocialAuthButtons({
  onGoogleSignIn,
  onMagicLinkSignIn,
  isLoading = false,
}: SocialAuthButtonsProps) {
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [magicLinkEmail, setMagicLinkEmail] = useState('');
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!magicLinkEmail) return;

    setMagicLinkLoading(true);
    try {
      await onMagicLinkSignIn(magicLinkEmail);
      setMagicLinkSent(true);
    } catch (error) {
      console.error('Magic link error:', error);
    } finally {
      setMagicLinkLoading(false);
    }
  };

  if (showMagicLink) {
    return (
      <div className="space-y-4">
        {!magicLinkSent ? (
          <>
            <form onSubmit={handleMagicLink} className="space-y-4">
              <div>
                <label
                  htmlFor="magic-email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter your email for magic link
                </label>
                <input
                  id="magic-email"
                  type="email"
                  value={magicLinkEmail}
                  onChange={(e) => setMagicLinkEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#094765] focus:ring-2 focus:ring-[#094765]/20 transition-colors"
                  placeholder="you@example.com"
                  required
                  disabled={magicLinkLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-lg py-3"
                disabled={magicLinkLoading || !magicLinkEmail}
              >
                {magicLinkLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending magic link...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send magic link
                  </>
                )}
              </Button>
            </form>

            <button
              onClick={() => setShowMagicLink(false)}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to other options
            </button>
          </>
        ) : (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Check your email!</h3>
              <p className="text-gray-600">
                We've sent a magic link to <span className="font-medium">{magicLinkEmail}</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Click the link in your email to sign in instantly
              </p>
            </div>
            <button
              onClick={() => {
                setShowMagicLink(false);
                setMagicLinkSent(false);
                setMagicLinkEmail('');
              }}
              className="text-sm text-[#094765] hover:text-[#156c8b] transition-colors font-medium"
            >
              Try another method
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full rounded-lg py-3 border-gray-300 hover:border-gray-400 transition-all duration-200 hover:shadow-md"
        onClick={onGoogleSignIn}
        disabled={isLoading}
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <Button
        type="button"
        variant="outline"
        className="w-full rounded-lg py-3 border-gray-300 hover:border-gray-400 transition-all duration-200 hover:shadow-md"
        onClick={() => setShowMagicLink(true)}
        disabled={isLoading}
      >
        <Mail className="mr-2 h-5 w-5" />
        Continue with magic link
      </Button>
    </div>
  );
}
