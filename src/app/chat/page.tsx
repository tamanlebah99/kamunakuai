'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getChatHistory, sendMessage, renameChat } from '@/lib/api/chat';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Share2, MoreVertical, Edit2 } from 'lucide-react';
import { Tab, Agent, getTabs, getFeaturedAgents } from '@/lib/api/explore';

interface ChatHistory {
  id: string;
  user_id: string;
  chat_name: string | null;
  mode: string | null;
  created_at: string;
  last_updated: string;
}

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTab, setSelectedTab] = useState('Top Picks');

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
        const [chatResponse, tabsResponse] = await Promise.all([
          getChatHistory(),
          getTabs(),
        ]);
        setChats(chatResponse.chats);
        setTabs(tabsResponse);

        // Load featured agents for initial tab
        const agentsResponse = await getFeaturedAgents('Top Picks');
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
        const response = await getFeaturedAgents(selectedTab);
        setAgents(response);
      } catch (error) {
        console.error('Error loading agents:', error);
      }
    };

    loadAgents();
  }, [selectedTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await sendMessage(selectedChat, inputMessage.trim());
      setMessages(prev => [...prev, {
        id: response.message.id,
        content: response.message.content,
        role: response.message.role,
        timestamp: response.message.timestamp
      }]);
      setInputMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleRenameChat = async (chatId: string) => {
    if (!newTitle.trim()) {
      setIsRenaming(false);
      return;
    }

    try {
      await renameChat(chatId, newTitle.trim());
      setChats(prev =>
        prev.map(chat =>
          chat.id === chatId ? { ...chat, chat_name: newTitle.trim() } : chat
        )
      );
    } catch (error) {
      console.error('Error renaming chat:', error);
    } finally {
      setIsRenaming(false);
    }
  };

  const handleExportChat = async (chatId: string) => {
    // TODO: Implement export chat
  };

  const handleShareChat = async (chatId: string) => {
    try {
      const shareData = {
        title: 'Kamunaku AI Chat',
        text: 'Lihat percakapan saya dengan Kamunaku AI',
        url: `${window.location.origin}/chat/${chatId}`,
      };
      await navigator.share(shareData);
    } catch (error) {
      console.error('Error sharing chat:', error);
    }
  };

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
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <button
            onClick={() => router.push('/chat')}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            Chat Baru
          </button>
        </div>

        {/* Tabs */}
        <div className="p-2 border-b border-gray-200 dark:border-gray-800">
          <div className="flex overflow-x-auto space-x-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.name)}
                className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
                  selectedTab === tab.name
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedChat === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''
              }`}
              onClick={() => setSelectedChat(chat.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {isRenaming && selectedChat === chat.id ? (
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onBlur={() => handleRenameChat(chat.id)}
                      className="w-full bg-transparent border-none focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    chat.chat_name || 'Chat Baru'
                  )}
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsRenaming(true);
                      setSelectedChat(chat.id);
                      setNewTitle(chat.chat_name || '');
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareChat(chat.id);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <Share2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {new Date(chat.last_updated).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xl">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Kamunaku AI
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  Asisten AI pribadi Anda. Mulai chat dengan mengetik pesan di bawah.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {agents.slice(0, 4).map(agent => (
                    <div
                      key={agent.id}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <img src={agent.icon} alt={agent.name} className="w-12 h-12 mb-2" />
                      <h3 className="font-medium text-gray-900 dark:text-white">{agent.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{agent.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        code({node, inline, className, children, ...props}) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ketik pesan Anda..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isSending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Mengirim...</span>
                </div>
              ) : (
                'Kirim'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
} 