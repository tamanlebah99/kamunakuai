'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Tab, Agent, getTabs, getFeaturedAgents } from '@/lib/api/explore';
import { Search, Menu } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AgentDetailModal } from '@/components/agent/AgentDetailModal';

export default function ExplorePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTab, setSelectedTab] = useState('Top Picks');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('auth');
      if (!auth) {
        router.push('/login');
        return false;
      }
      try {
        const authData = JSON.parse(auth);
        if (!authData.token || !authData.user) {
          localStorage.removeItem('auth');
          router.push('/login');
          return false;
        }
        return true;
      } catch (error) {
        localStorage.removeItem('auth');
        router.push('/login');
        return false;
      }
    };

    const loadInitialData = async () => {
      try {
        const [tabsResponse, agentsResponse] = await Promise.all([
          getTabs(),
          getFeaturedAgents('Top Picks'),
        ]);
        setTabs(tabsResponse);
        setAgents(agentsResponse);
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (checkAuth()) {
      loadInitialData();
    }
  }, [router]);

  useEffect(() => {
    const loadAgents = async () => {
      try {
        setIsLoading(true);
        const response = await getFeaturedAgents(selectedTab);
        setAgents(response);
      } catch (error) {
        console.error('Error loading agents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgents();
  }, [selectedTab]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className={`flex-1 transition-all duration-200 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        <div className="px-4 py-8 lg:px-8 max-w-[850px] mx-auto">
          <h1 className="text-3xl font-bold mb-2 text-center">Daftar Agent</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-2xl mx-auto">
            Temukan dan pilih agent AI yang sesuai dengan kebutuhan Anda. Setiap agent memiliki keahlian dan
            pengetahuan khusus untuk membantu menyelesaikan tugas-tugas spesifik.
          </p>

          {/* Search input */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari Agent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="flex overflow-x-auto space-x-8 justify-center">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.name)}
                  className={`pb-1 text-sm font-medium whitespace-nowrap ${
                    selectedTab === tab.name
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => setSelectedAgent(agent)}
              >
                <img
                  src={agent.icon}
                  alt={agent.name}
                  className="w-12 h-12 rounded-full"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {agent.name}
                    </h3>
                    {agent.rating && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {agent.rating} ★
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {agent.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    By {agent.provider}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* See more button */}
          <button className="w-full mt-8 py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 transition-colors">
            See more
          </button>
        </div>
      </main>

      {/* Agent Detail Modal */}
      {selectedAgent && (
        <AgentDetailModal
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          onStartChat={() => router.push(`/chat?agent=${selectedAgent.id}`)}
        />
      )}
    </div>
  );
} 