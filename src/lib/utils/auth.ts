interface AuthData {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export function getAuthData(): AuthData {
  const auth = localStorage.getItem('auth');
  if (!auth) {
    throw new Error('No auth data found');
  }
  return JSON.parse(auth);
}

export function getAuthToken(): string {
  return getAuthData().token;
}

export function setAuthData(data: AuthData): void {
  localStorage.setItem('auth', JSON.stringify(data));
}

export function clearAuthData(): void {
  localStorage.removeItem('auth');
} 