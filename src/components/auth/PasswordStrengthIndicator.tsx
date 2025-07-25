import { useMemo } from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    // Common patterns check
    const commonPatterns = ['123456', 'password', 'qwerty', 'abc123'];
    if (!commonPatterns.some((pattern) => password.toLowerCase().includes(pattern))) {
      score += 1;
    }

    // Determine strength level
    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 6) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              level <= strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-600">
          Password strength: <span className="font-medium">{strength.label}</span>
        </p>

        {strength.score < 3 && (
          <p className="text-xs text-gray-500">
            {password.length < 8 && 'Use 8+ characters • '}
            {!/[A-Z]/.test(password) && 'Add uppercase • '}
            {!/[0-9]/.test(password) && 'Add numbers • '}
            {!/[^A-Za-z0-9]/.test(password) && 'Add symbols'}
          </p>
        )}
      </div>
    </div>
  );
}
