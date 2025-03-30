import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/lib/utils/auth';

// Helper untuk mendapatkan user data
const getAuthData = () => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  return auth;
};

export interface Tab {
  id: string;
  name: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  provider: string;
  provider_url: string;
  icon: string;
  rating?: number;
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

export interface AgentDetail extends Agent {
  category: string;
  conversation_count: number;
  conversation_starters: string[];
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

    const data = await response.json();
    return data.map((name: string, index: number) => ({
      id: index.toString(),
      name,
    }));
  } catch (error) {
    console.error('Error fetching tabs:', error);
    return [];
  }
}

export async function getFeaturedAgents(tab: string): Promise<Agent[]> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(`${API_BASE_URL}/explore/featured-agents?tab=${encodeURIComponent(tab)}&userId=${userId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch featured agents');
    }

    const data = await response.json();
    return data.map((agent: any) => ({
      ...agent,
      provider_url: `https://${agent.provider}`,
      rating: agent.description.match(/(\d+\.?\d*)\s*★/) ? parseFloat(agent.description.match(/(\d+\.?\d*)\s*★/)[1]) : undefined
    }));
  } catch (error) {
    console.error('Error fetching featured agents:', error);
    return [];
  }
}

export async function getRecentAgents(): Promise<Agent[]> {
  // Mock data untuk testing
  return [
    {
      id: 1,
      name: "Expedia",
      description: "Bantu rencanakan perjalanan Anda – temukan tempat tinggal, destinasi, dan aktivitas.",
      provider: "expedia.com",
      provider_url: "https://expedia.com",
      icon: "https://example.com/expedia-icon.png"
    },
    {
      id: 2,
      name: "Video AI",
      description: "4.1 ★ - Pembuat video AI – buat video menarik dengan suara dalam berbagai bahasa!",
      provider: "invideo.io",
      provider_url: "https://invideo.io",
      icon: "https://example.com/videoai-icon.png"
    }
  ];
}

export async function getChatHistory(): Promise<ChatHistory> {
  // Mock data untuk testing
  return {
    today: [
      {
        chat_id: 6,
        title: "Chat 06",
        timestamp: "2023-03-30T10:00:00Z"
      }
    ],
    previous_7_days: [
      {
        chat_id: 1,
        title: "Chat 01",
        timestamp: "2023-03-28T12:30:00Z"
      },
      {
        chat_id: 2,
        title: "Chat 02",
        timestamp: "2023-03-27T09:45:00Z"
      },
      {
        chat_id: 3,
        title: "Chat 03",
        timestamp: "2023-03-26T15:20:00Z"
      }
    ],
    previous_30_days: [
      {
        chat_id: 4,
        title: "Chat 04",
        timestamp: "2023-03-15T08:10:00Z"
      },
      {
        chat_id: 5,
        title: "Chat 05",
        timestamp: "2023-03-10T14:50:00Z"
      }
    ]
  };
}

export async function getAgentDetail(agentId: number): Promise<AgentDetail> {
  try {
    const authData = getAuthData();
    const userId = authData.user?.id;

    if (!userId) {
      throw new Error('User ID not found');
    }

    const response = await fetch(`https://coachbot-n8n-01.fly.dev/webhook/agents/detail?userId=${userId}&agentId=${agentId}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch agent details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching agent details:', error);
    throw error;
  }
} 