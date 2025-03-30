'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ChatBubbleLeftIcon, 
  PlusCircleIcon,
  SunIcon,
  MoonIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { getChatHistory, deleteChat, renameChat } from '@/lib/api/chat';

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
}

export default function Sidebar() {
  const router = useRouter();
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
    try {
      const response = await getChatHistory();
      setChatHistory(response.chats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('Apakah Anda yakin ingin menghapus chat ini?')) return;

    try {
      await deleteChat(chatId);
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleRenameClick = (chatId: string, currentTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    setEditingChatId(chatId);
    setNewTitle(currentTitle);
  };

  const handleRenameSubmit = async (chatId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      await renameChat(chatId, newTitle);
      setChatHistory(prev =>
        prev.map(chat =>
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
      setEditingChatId(null);
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* New Chat Button */}
      <Link
        href="/chat"
        className="flex items-center gap-2 m-4 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <PlusCircleIcon className="h-5 w-5" />
        <span>Chat Baru</span>
      </Link>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : (
          chatHistory.map((chat) => (
            <div key={chat.id} className="relative group">
              {editingChatId === chat.id ? (
                <form
                  onSubmit={(e) => handleRenameSubmit(chat.id, e)}
                  className="p-2 mx-2"
                >
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-1 rounded border dark:bg-gray-800 dark:border-gray-700"
                    autoFocus
                    onBlur={() => setEditingChatId(null)}
                  />
                </form>
              ) : (
                <Link
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-2 p-2 mx-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg group"
                >
                  <ChatBubbleLeftIcon className="h-5 w-5" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm">{chat.title}</p>
                    <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                  </div>
                  <div className="hidden group-hover:flex gap-1">
                    <button
                      onClick={(e) => handleRenameClick(chat.id, chat.title, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-500"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </Link>
              )}
            </div>
          ))
        )}
      </div>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex items-center gap-2 m-4 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        {theme === 'dark' ? (
          <SunIcon className="h-5 w-5" />
        ) : (
          <MoonIcon className="h-5 w-5" />
        )}
        <span>{theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}</span>
      </button>
    </div>
  );
} 