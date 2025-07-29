export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

export function generateApiKey(): string {
  // Generate a random UUID and format it as an API key
  const uuid = crypto.randomUUID();
  // Remove hyphens and add prefix
  const key = uuid.replace(/-/g, '');
  return `proj_${key}`;
}

export function validateProjectName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Project name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Project name must be at least 3 characters' };
  }

  if (name.length > 50) {
    return { valid: false, error: 'Project name must be less than 50 characters' };
  }

  // Check for valid characters (alphanumeric, spaces, hyphens, underscores)
  const validPattern = /^[a-zA-Z0-9\s\-_]+$/;
  if (!validPattern.test(name)) {
    return {
      valid: false,
      error: 'Project name can only contain letters, numbers, spaces, hyphens, and underscores',
    };
  }

  return { valid: true };
}

export function parseAllowedDomains(input: string): string[] {
  if (!input || input.trim().length === 0) {
    return [];
  }

  return input
    .split(/[,\n]+/) // Split by comma or newline
    .map((domain) => domain.trim())
    .filter((domain) => domain.length > 0)
    .map((domain) => {
      // Remove protocol if present
      return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    });
}
