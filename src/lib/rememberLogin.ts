const STORAGE_KEY = 'nexestate-remember-login';

interface SavedLogin {
  email: string;
  password: string;
}

export function loadSavedLogin(): SavedLogin | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedLogin;
    if (!parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLogin(email: string, password: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ email, password }));
}

export function clearSavedLogin() {
  localStorage.removeItem(STORAGE_KEY);
}
