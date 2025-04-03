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

  const loadInitialData = async () => {
    try {
      // Cek apakah di client side dan ada auth
      if (typeof window === 'undefined') return;
      
      const auth = window.localStorage.getItem('auth');
      if (!auth) {
        // Reset data jika tidak ada auth
        setRecentAgents([]);
        setChatHistory({
          today: [],
          previous_7_days: [],
          previous_30_days: []
        });
        return;
      }

      const authData = JSON.parse(auth);
      if (!authData.user || !authData.user.id) {
        // Reset data jika tidak ada user ID
        setRecentAgents([]);
        setChatHistory({
          today: [],
          previous_7_days: [],
          previous_30_days: []
        });
        return;
      }
      
      // Load recent agents
      const agents = await getRecentAgents();
      setRecentAgents(agents);

      // Load chat history
      const history = await getChatHistorySidebar();
      setChatHistory(history);
      isInitialLoad.current = false;
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Reset data jika terjadi error
      setRecentAgents([]);
      setChatHistory({
        today: [],
        previous_7_days: [],
        previous_30_days: []
      });
    }
  };

  // Effect untuk initial load dan setup event listener
  useEffect(() => {
    loadInitialData();

    // Setup event listener untuk auth changes
    window.addEventListener('auth-changed', loadInitialData);

    return () => {
      window.removeEventListener('auth-changed', loadInitialData);
    };
  }, []); 

  const loadChatHistory = async () => {
    try {
      // Skip jika tidak ada auth
      if (typeof window === 'undefined') return;
      
      const auth = window.localStorage.getItem('auth');
      if (!auth) {
        // Reset chat history jika tidak ada auth
        setChatHistory({
          today: [],
          previous_7_days: [],
          previous_30_days: []
        });
        return;
      }

      const authData = JSON.parse(auth);
      if (!authData.user || !authData.user.id) {
        // Reset chat history jika tidak ada user ID
        setChatHistory({
          today: [],
          previous_7_days: [],
          previous_30_days: []
        });
        return;
      }

      // Load chat history dengan user ID yang baru
      const history = await getChatHistorySidebar();
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Reset chat history jika terjadi error
      setChatHistory({
        today: [],
        previous_7_days: [],
        previous_30_days: []
      });
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