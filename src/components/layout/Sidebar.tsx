'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Plus, User, ChevronDown, LogOut, Settings, Crown } from 'lucide-react';
import { getRecentAgents, getChatHistory } from '@/lib/api/explore';
import type { Agent, ChatHistory } from '@/lib/api/explore';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    today: [],
    previous_7_days: [],
    previous_30_days: []
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [agents, history] = await Promise.all([
          getRecentAgents(),
          getChatHistory()
        ]);
        setRecentAgents(agents);
        setChatHistory(history);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Get username from localStorage
    try {
      const auth = localStorage.getItem('auth');
      if (auth) {
        const authData = JSON.parse(auth);
        if (authData?.user?.name) {
          setUsername(authData.user.name);
        }
      }
    } catch (error) {
      console.error('Error getting username:', error);
    }
  }, []);

  useEffect(() => {
    // Handle click outside to close profile menu
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Hapus token dari localStorage
      localStorage.removeItem('auth');

      // Hapus cookie Google jika ada
      document.cookie = 'g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Tunggu sebentar sebelum redirect untuk memastikan cleanup selesai
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect ke halaman login
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      // Tetap redirect ke login jika terjadi error
      router.push('/login');
    }
  };

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-screen w-64 bg-[#f7f7f8] dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1.5 text-sm bg-transparent focus:outline-none rounded-lg hover:bg-white dark:hover:bg-gray-800"
              />
            </div>
            <button
              onClick={() => router.push('/chat')}
              className="p-2 hover:bg-white dark:hover:bg-gray-800 rounded-lg ml-2"
            >
              <Plus size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Explore Agents */}
            <Link
              href="/explore"
              className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 block"
            >
              Jelajahi Agent
            </Link>

            {/* Recent Agents */}
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">AGENTS</h3>
              <div className="space-y-1">
                {recentAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => router.push(`/chat?agent=${agent.id}`, { scroll: false })}
                    className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 rounded hover:bg-white dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <img
                      src={agent.icon}
                      alt={agent.name}
                      className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700"
                    />
                    <span className="truncate">{agent.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Chat History */}
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">RIWAYAT CHAT</h3>
              
              {/* Today */}
              {chatHistory.today.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hari Ini</h4>
                  {chatHistory.today.map((chat) => (
                    <button
                      key={chat.chat_id}
                      onClick={() => router.push(`/chat?chatId=${chat.chat_id}`, { scroll: false })}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 rounded hover:bg-white dark:hover:bg-gray-800"
                    >
                      {chat.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Previous 7 days */}
              {chatHistory.previous_7_days.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-1">7 Hari Terakhir</h4>
                  {chatHistory.previous_7_days.map((chat) => (
                    <button
                      key={chat.chat_id}
                      onClick={() => router.push(`/chat?chatId=${chat.chat_id}`, { scroll: false })}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 rounded hover:bg-white dark:hover:bg-gray-800"
                    >
                      {chat.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Previous 30 days */}
              {chatHistory.previous_30_days.length > 0 && (
                <div>
                  <h4 className="text-xs text-gray-500 dark:text-gray-400 mb-1">30 Hari Terakhir</h4>
                  {chatHistory.previous_30_days.map((chat) => (
                    <button
                      key={chat.chat_id}
                      onClick={() => router.push(`/chat?chatId=${chat.chat_id}`, { scroll: false })}
                      className="w-full text-left px-2 py-1.5 text-sm text-gray-700 dark:text-gray-300 rounded hover:bg-white dark:hover:bg-gray-800"
                    >
                      {chat.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Profile - Fixed at bottom */}
          <div className="relative mt-auto border-t border-gray-200 dark:border-gray-800" ref={profileMenuRef}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white dark:hover:bg-gray-800"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <User size={20} className="text-gray-500" />
              </div>
              <span className="flex-1 text-sm font-medium text-left text-gray-700 dark:text-gray-300">{username || 'Profil Saya'}</span>
              <ChevronDown size={16} className={`text-gray-500 transform transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute bottom-[100%] left-0 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="py-1">
                  <button
                    onClick={() => router.push('/settings')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Settings size={16} className="text-gray-500" />
                    <span>Pengaturan</span>
                  </button>
                  <button
                    onClick={() => router.push('/upgrade')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <Crown size={16} className="text-gray-500" />
                    <span>Tingkatkan Paket</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOut size={16} className="text-red-600" />
                    <span>Keluar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
} 