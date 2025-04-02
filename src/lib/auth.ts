import { useRouter } from 'next/navigation';

export interface AuthData {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export const checkAuth = (): AuthData | null => {
  const auth = localStorage.getItem('auth');
  if (!auth) {
    return null;
  }
  
  try {
    const authData = JSON.parse(auth);
    if (!authData.token || !authData.user) {
      localStorage.removeItem('auth');
      return null;
    }
    return authData;
  } catch (error) {
    localStorage.removeItem('auth');
    return null;
  }
}; 