import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { PaywallModal } from '@/components/PaywallModal';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { getAuthErrorMessage } from '@/lib/auth-errors';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export function RegisterPage() {
  const [location, navigate] = useLocation();
  const { signUp, signInWithGoogle, signInWithMagicLink } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // Get redirect URL from query params
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await signUp(data.email, data.password);
      toast({
        title: 'Account created!',
        description: 'Welcome to your 7-day free trial.',
      });
      // Show paywall modal after successful registration
      setShowPaywall(true);
    } catch (error: any) {
      toast({
        title: 'Registration Failed',
        description: getAuthErrorMessage(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaywallComplete = () => {
    setShowPaywall(false);
    navigate(redirectTo);
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to sign up with Google.',
        variant: 'destructive',
      });
    }
  };

  const handleMagicLinkSignIn = async (email: string) => {
    try {
      await signInWithMagicLink(email);
      toast({
        title: 'Magic link sent!',
        description: 'Check your email for the sign-in link.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send magic link.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Start collecting better QA feedback today">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              id="email"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#094765] focus:ring-2 focus:ring-[#094765]/20 transition-colors"
              placeholder="you@example.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                    message: 'Password must contain uppercase, lowercase, and a number',
                  },
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#094765] focus:ring-2 focus:ring-[#094765]/20 transition-colors pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <PasswordStrengthIndicator password={passwordValue} />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Confirm password
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (value) => value === passwordValue || 'Passwords do not match',
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-[#094765] focus:ring-2 focus:ring-[#094765]/20 transition-colors pr-12"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div>
            <label className="flex items-start">
              <input
                {...register('acceptTerms', {
                  required: 'You must accept the terms and conditions',
                })}
                type="checkbox"
                className="h-4 w-4 text-[#094765] focus:ring-[#094765] border-gray-300 rounded mt-0.5"
              />
              <span className="ml-2 text-sm text-gray-700">
                I agree to the{' '}
                <a href="#" className="text-[#094765] hover:text-[#156c8b] transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-[#094765] hover:text-[#156c8b] transition-colors">
                  Privacy Policy
                </a>
              </span>
            </label>
            {errors.acceptTerms && (
              <p className="mt-1 text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}
          </div>
        </div>

        <Button
          type="submit"
          className="w-full magnetic-button rounded-lg py-3"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-gray-500">Or sign up with</span>
          </div>
        </div>

        <SocialAuthButtons
          onGoogleSignIn={handleGoogleSignIn}
          onMagicLinkSignIn={handleMagicLinkSignIn}
          isLoading={isLoading}
        />

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-[#094765] hover:text-[#156c8b] transition-colors font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>

      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onComplete={handlePaywallComplete}
      />
    </AuthLayout>
  );
}
