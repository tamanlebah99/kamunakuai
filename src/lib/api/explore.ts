import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/lib/utils/auth';

export interface Tab {
  id: string;
  name: string;
}

export interface Agent {
  id: number;
  name: string;
  description: string;
  provider: string;
  icon: string;
}

export async function getTabs(): Promise<Tab[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/explore/tabs`, {
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
    const response = await fetch(`${API_BASE_URL}/explore/featured-agents?tab=${encodeURIComponent(tab)}`, {
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