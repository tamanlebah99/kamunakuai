'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { Tab, Agent, getTabs, getAllAgents } from '@/lib/api/explore';

interface ExploreContextType {
  tabs: Tab[];
  allAgents: Agent[];
  filteredAgents: Agent[];
  selectedTab: Tab;
  setSelectedTab: (tab: Tab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
}

const ExploreContext = createContext<ExploreContextType | undefined>(undefined);

export function ExploreProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab>({ category_id: 1, category_name: 'Pengembangan Diri', sequence: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      if (typeof window === 'undefined') return;
      
      const auth = window.localStorage.getItem('auth');
      if (!auth) {
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      const authData = JSON.parse(auth);
      
      // Load semua data sekali saja
      const [tabsResponse, agentsResponse] = await Promise.all([
        getTabs(),
        getAllAgents(), // Ganti ke getAllAgents untuk mengambil semua agents
      ]);
      
      setTabs(tabsResponse);
      setAllAgents(agentsResponse);
    } catch (error) {
      console.error('Error loading initial data:', error);
      if (error instanceof Error && error.message === 'User ID not found') {
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tabsData, agentsData] = await Promise.all([
          getTabs(),
          getAllAgents()
        ]);

        // Tambahkan tab "Semua" di awal
        const allTab: Tab = {
          category_id: 0, // Gunakan 0 untuk tab "Semua"
          category_name: "Semua",
          sequence: 0
        };
        
        setTabs([allTab, ...tabsData]);
        setAllAgents(agentsData);
        setSelectedTab(allTab); // Set default tab ke "Semua"
      } catch (error) {
        console.error('Error fetching explore data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (allAgents.length > 0) {
      let filtered = allAgents;

      // Filter berdasarkan tab yang dipilih
      if (selectedTab.category_id !== 0) { // Jika bukan tab "Semua"
        filtered = allAgents.filter(agent => 
          agent.category_id === selectedTab.category_id
        );
      }

      // Filter berdasarkan pencarian
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(agent =>
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query)
        );
      }

      setFilteredAgents(filtered);
    }
  }, [selectedTab, searchQuery, allAgents]);

  return (
    <ExploreContext.Provider 
      value={{ 
        tabs, 
        allAgents,
        filteredAgents, 
        selectedTab, 
        setSelectedTab,
        searchQuery,
        setSearchQuery,
        isLoading 
      }}
    >
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