export function validateProjectKey(key: string): boolean {
  // Project keys should follow format: proj_XXXXXXXXXXXX
  const projectKeyRegex = /^proj_[a-zA-Z0-9]{12,}$/;
  return projectKeyRegex.test(key);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function sanitizeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}