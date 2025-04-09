'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Menu } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AgentDetailModal } from '@/components/agent/AgentDetailModal';
import { AgentCard } from '@/components/agent/AgentCard';
import { useExplore, ExploreProvider } from '@/contexts/ExploreContext';
import type { Agent } from '@/lib/api/explore';

export default function ExplorePage() {
  return (
    <ExploreProvider>
      <ExploreContent />
    </ExploreProvider>
  );
}

function ExploreContent() {
  const router = useRouter();
  const { 
    tabs, 
    filteredAgents, 
    selectedTab, 
    setSelectedTab, 
    searchQuery,
    setSearchQuery,
    isLoading 
  } = useExplore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="bg-white dark:bg-gray-900">
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className={`flex-1 transition-all duration-200 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={20} className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Main Content Container - Fixed width and centered */}
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Header Section - Fixed height, no flex */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Daftar Asisten AI</h1>
            <p className="text-gray-600 dark:text-gray-400 text-base min-h-[48px] px-4 sm:px-8">
              Temukan dan pilih asisten AI yang sesuai dengan kebutuhan Kamu.
            </p>
          </div>

          {/* Search input */}
          <div className="relative mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Cari Asisten"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900"
            />
          </div>

          {/* Tabs - Fixed height scrollable container with better positioning */}
          <div className="relative mb-8">
            <div className="overflow-x-auto no-scrollbar py-1" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex pb-1 gap-2">
                {isLoading ? (
                  <div className="flex gap-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="h-8 w-28 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  tabs.sort((a, b) => a.sequence - b.sequence).map(tab => (
                    <button
                      key={tab.category_id}
                      onClick={() => setSelectedTab(tab)}
                      className={`py-1 px-4 rounded-full text-sm font-medium whitespace-nowrap ${
                        selectedTab.category_id === tab.category_id
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      {tab.category_name}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 gap-6">
            {isLoading ? (
              // Skeleton loading untuk agents
              [...Array(4)].map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                    <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </div>
                </div>
              ))
            ) : (
              filteredAgents.map((agent) => (
                <AgentCard 
                  key={agent.id} 
                  agent={agent} 
                  onClick={() => setSelectedAgent(agent)}
                />
              ))
            )}
          </div>
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