'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Menu, Plus } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { AgentDetailModal } from '@/components/agent/AgentDetailModal';
import { AgentCard } from '@/components/agent/AgentCard';
import { useExplore } from '@/contexts/ExploreContext';
import type { Agent } from '@/lib/api/explore';

function ExplorePage() {
  const router = useRouter();
  const { tabs, agents, selectedTab, setSelectedTab } = useExplore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
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

        <div className="px-4 py-8 lg:px-8 max-w-[850px] mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-8">Daftar Agent</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center max-w-2xl mx-auto">
            Temukan dan pilih agent AI yang sesuai dengan kebutuhan Anda.
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
              {tabs.sort((a, b) => a.sequence - b.sequence).map(tab => (
                <button
                  key={tab.category_id}
                  onClick={() => setSelectedTab(tab)}
                  className={`pb-1 text-sm font-medium whitespace-nowrap ${
                    selectedTab.category_id === tab.category_id
                      ? 'text-gray-900 dark:text-white border-b-2 border-gray-900 dark:border-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {tab.category_name}
                </button>
              ))}
            </div>
          </div>

          {/* Agents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agents.map((agent) => (
              <AgentCard 
                key={agent.id} 
                agent={agent} 
                onClick={() => setSelectedAgent(agent)}
              />
            ))}
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

// Wrap the main component with Suspense
export default function ExplorePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExplorePage />
    </Suspense>
  );
} 