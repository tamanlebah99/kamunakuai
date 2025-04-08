import { AuthData } from '@/contexts/AuthContext';

// URL API n8n
const N8N_API_URL = 'https://coachbot-n8n-01.fly.dev/webhook';

export async function getAuthData(): Promise<AuthData | null> {
  try {
    console.log('Getting auth data from:', `${N8N_API_URL}/auth/me`);
    
    const response = await fetch(`${N8N_API_URL}/auth/me`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: ''  // Kirim string kosong jika tidak ada token
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      console.log('Auth failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('Auth data:', data);
    return data;
  } catch (error) {
    console.error('Error getting auth data:', error);
    return null;
  }
}

export async function getAuthToken(): Promise<string | null> {
  const authData = await getAuthData();
  return authData?.token || null;
}

export async function setAuthData(data: AuthData): Promise<void> {
  // Tidak perlu menyimpan di localStorage karena menggunakan HttpOnly Cookies
  // Cookie diatur oleh backend
}

export async function clearAuthData(): Promise<void> {
  // Logout dengan menghapus cookie
  console.log('Logging out at:', `${N8N_API_URL}/auth/logout`);
  
  await fetch(`${N8N_API_URL}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  });
} 