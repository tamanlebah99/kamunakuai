import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/lib/utils/auth';

// Helper untuk mendapatkan user data
const getAuthData = () => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  return auth;
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

export async function getTabs(): Promise<Tab[]> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(`${API_BASE_URL}/explore/tabs?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
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

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(`${API_BASE_URL}/explore/featured-agents?userId=${userId}&categoryId=${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
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

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(`${API_BASE_URL}/explore/recent-agents?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent agents');
    }

    const data = await response.json();
    return data.map((agent: any) => ({
      ...agent,
      provider_url: `https://${agent.provider}`,
      rating: agent.description.match(/(\d+\.?\d*)\s*★/) ? parseFloat(agent.description.match(/(\d+\.?\d*)\s*★/)[1]) : undefined
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

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(`${API_BASE_URL}/chat/history-sidebar?userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
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

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(`${API_BASE_URL}/agents/detail?userId=${userId}&agentId=${agentId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agent details');
    }

    const data = await response.json();
    return data[0];  // Response adalah array, ambil item pertama
  } catch (error) {
    console.error('Error fetching agent details:', error);
    throw error;
  }
} 