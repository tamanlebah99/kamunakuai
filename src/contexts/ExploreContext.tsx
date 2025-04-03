'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tab, Agent, getTabs, getFeaturedAgents } from '@/lib/api/explore';

interface ExploreContextType {
  tabs: Tab[];
  agents: Agent[];
  selectedTab: Tab;
  setSelectedTab: (tab: Tab) => void;
}

const ExploreContext = createContext<ExploreContextType | undefined>(undefined);

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab>({ category_id: 1, category_name: 'Pengembangan Diri', sequence: 1 });
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadInitialData = async () => {
    try {
      // Cek apakah di client side dan ada auth
      if (typeof window === 'undefined') return;
      
      const auth = window.localStorage.getItem('auth');
      if (!auth) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      const authData = JSON.parse(auth);
      
      // Load tabs dan featured agents sekali saja
      const [tabsResponse, agentsResponse] = await Promise.all([
        getTabs(),
        getFeaturedAgents(1), // Default category_id: 1
      ]);
      
      setTabs(tabsResponse);
      setAgents(agentsResponse);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Jika error karena autentikasi, set isAuthenticated ke false
      if (error instanceof Error && error.message === 'User ID not found') {
        setIsAuthenticated(false);
      }
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

  // Load agents ketika tab berubah
  useEffect(() => {
    const loadAgents = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await getFeaturedAgents(selectedTab.category_id);
        setAgents(response);
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    };

    loadAgents();
  }, [selectedTab.category_id, isAuthenticated]);

  return (
    <ExploreContext.Provider value={{ tabs, agents, selectedTab, setSelectedTab }}>
      {children}
    </ExploreContext.Provider>
  );
}

export function useExplore() {
  const context = useContext(ExploreContext);
  if (context === undefined) {
    throw new Error('useExplore must be used within an ExploreProvider');
  }
  return context;
} 