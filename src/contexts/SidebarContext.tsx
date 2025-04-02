'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { getRecentAgents } from '@/lib/api/explore';
import { getChatHistory as getChatHistorySidebar } from '@/lib/api/explore';
import type { Agent, ChatHistory } from '@/lib/api/explore';

interface SidebarContextType {
  recentAgents: Agent[];
  chatHistory: ChatHistory;
  loadChatHistory: () => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    today: [],
    previous_7_days: [],
    previous_30_days: []
  });
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const auth = localStorage.getItem('auth');
        if (!auth) return;

        const authData = JSON.parse(auth);
        
        // Load recent agents sekali saja
        const agents = await getRecentAgents();
        setRecentAgents(agents);

        // Load chat history hanya jika belum pernah dimuat
        if (isInitialLoad.current) {
          const history = await getChatHistorySidebar();
          setChatHistory(history);
          isInitialLoad.current = false;
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []); // Hanya dijalankan sekali saat aplikasi dimuat

  const loadChatHistory = async () => {
    try {
      // Skip jika tidak ada auth
      const auth = localStorage.getItem('auth');
      if (!auth) return;

      const history = await getChatHistorySidebar();
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  return (
    <SidebarContext.Provider value={{ recentAgents, chatHistory, loadChatHistory }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
} 