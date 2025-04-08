import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/lib/utils/auth';

// Helper untuk mendapatkan user data
const getAuthData = () => {
  try {
    const auth = localStorage.getItem('auth');
    if (!auth) return {};
    
    const authData = JSON.parse(auth);
    // Pastikan kita menggunakan user_id, bukan token
    return {
      token: authData.token,
      user: {
        id: authData.user?.id || '', // user_id yang benar
        name: authData.user?.name,
        email: authData.user?.email
      }
    };
  } catch (error) {
    console.error('Error parsing auth data:', error);
    return {};
  }
};

export interface Tab {
  category_id: number;
  category_name: string;
  sequence: number;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  provider: string;
  icon_url: string;
  webhook_url: string;
  category?: string;
  category_id?: number;
}

export interface ChatItem {
  chat_id: number;
  title: string;
  timestamp: string;
}

export interface ChatHistory {
  today: ChatItem[];
  previous_7_days: ChatItem[];
  previous_30_days: ChatItem[];
}

export interface AgentDetail {
  id: string;
  name: string;
  description: string;
  provider: string;
  icon_url: string;
  rating: string;
  category: string;
  conversation_count: number;
  conversation_starters: string[];
  webhook_url: string;
}

export interface ExtendedAgent extends Omit<Agent, 'id'> {
  id: string;
  category: string;
  conversation_count: number;
  conversation_starters: string[];
  rating: string;
  provider: string;
  description: string;
  icon_url: string;
  name: string;
  webhook_url: string;
}

export async function getTabs(skipAuthCheck: boolean = false): Promise<Tab[]> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;
    const token = authData.token;

    // Skip auth check jika parameter skipAuthCheck true
    if (!skipAuthCheck && (!userId || !token)) {
      throw new Error('User ID or session not found');
    }

    const response = await fetch(`${API_BASE_URL}/explore/tabs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: userId || '',
        sessionId: token || ''
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tabs');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return [];
  }
}

export async function getFeaturedAgents(categoryId: number): Promise<Agent[]> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;
    const token = authData.token;

    if (!userId || !token) {
      throw new Error('User ID or session not found');
    }

    const response = await fetch(`${API_BASE_URL}/explore/featured-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        categoryId,
        sessionId: token
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch featured agents');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching featured agents:', error);
    return [];
  }
}

export async function getRecentAgents(): Promise<Agent[]> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;
    const token = authData.token;

    if (!userId || !token) {
      throw new Error('User ID or session not found');
    }

    const response = await fetch(`${API_BASE_URL}/explore/recent-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        sessionId: token
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent agents');
    }

    const data = await response.json();
    return data.map((agent: Agent) => ({
      ...agent,
      provider_url: `https://${agent.provider}`,
      rating: agent.description && agent.description.match(/(\d+\.?\d*)\s*★/) 
        ? parseFloat(agent.description.match(/(\d+\.?\d*)\s*★/)[1]) 
        : undefined
    }));
  } catch (error) {
    console.error('Error fetching recent agents:', error);
    return [];
  }
}

export async function getChatHistory(): Promise<ChatHistory> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;
    const token = authData.token;

    if (!userId || !token) {
      throw new Error('User ID or session not found');
    }

    const response = await fetch(`${API_BASE_URL}/chat/history-sidebar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        sessionId: token
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    const data = await response.json();
    return data[0] || {
      today: [],
      previous_7_days: [],
      previous_30_days: []
    };
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return {
      today: [],
      previous_7_days: [],
      previous_30_days: []
    };
  }
}

export async function getAgentDetail(agentId: string): Promise<AgentDetail> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;
    const token = authData.token;

    if (!userId || !token) {
      throw new Error('User ID or session not found');
    }

    const response = await fetch(`${API_BASE_URL}/agents/detail`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        agentId,
        sessionId: token
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agent details');
    }

    const data = await response.json();
    return data[0];
  } catch (error) {
    console.error('Error fetching agent details:', error);
    throw error;
  }
}

export async function getAllAgents(): Promise<Agent[]> {
  try {
    const auth = localStorage.getItem('auth');
    if (!auth) throw new Error('User ID not found');

    const authData = JSON.parse(auth);
    if (!authData?.user?.id) throw new Error('User ID not found');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 detik timeout

    const response = await fetch(`${API_BASE_URL}/explore/featured-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        userId: authData.user.id,
        sessionId: authData.token
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch agents: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    // Pastikan setiap agent memiliki category_id
    return data.map((agent: any) => ({
      ...agent,
      category_id: agent.category_id || 1 // Default ke 1 jika tidak ada
    }));
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout: Gagal mengambil data agent');
      } else if (!navigator.onLine) {
        console.error('Tidak ada koneksi internet');
      } else {
        console.error('Error fetching all agents:', error.message);
      }
    }
    return [];
  }
} 