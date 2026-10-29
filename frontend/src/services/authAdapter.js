/**
 * ==============================================================================
 * REPLACEABLE AUTHENTICATION ADAPTER
 *
 * Provides a mockable / pluggable authentication facade.
 *
 * IMPORTANT:
 * This is local demo session access, NOT real institutional SSO / OAuth2.
 * The production system will replace this file with authentic OIDC / SAML2 flow.
 * ==============================================================================
 */

const STORAGE_KEY = 'impactos_demo_session';

export const DEMO_USER = {
  id: 'usr-demo-01',
  name: 'Prof. Alistair Vance',
  role: 'Dean of Institutional Planning',
  email: 'vance@impactos.edu',
  isDemoAuth: true,
  notice: 'Local demo access, not real authentication',
};

export const authAdapter = {
  /**
   * Get current authenticated user or null
   */
  getCurrentUser() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Ignore storage errors
    }
    // Default to DEMO_USER active for seamless demo experience
    return DEMO_USER;
  },

  /**
   * Check if session exists
   */
  isAuthenticated() {
    return Boolean(this.getCurrentUser());
  },

  /**
   * Authenticate credentials
   */
  async login({ email, password }) {
    // Artificial delay to simulate real auth roundtrip
    await new Promise((resolve) => setTimeout(resolve, 400));

    if (!email || !email.includes('@')) {
      throw new Error('Please enter a valid academic email address.');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters.');
    }

    // Accept any valid-looking demo credentials
    const user = {
      ...DEMO_USER,
      email: email.trim().toLowerCase(),
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Administrator',
      loginTime: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // storage quota or incognito
    }

    return user;
  },

  /**
   * End current session
   */
  async logout() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    return true;
  },
};

