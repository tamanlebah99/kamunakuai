'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getChatHistory, renameChat } from '@/lib/api/chat';
import { getAgentDetail } from '@/lib/api/explore';
import { getAuthToken } from '@/lib/utils/auth';
import type { Message } from '@/lib/api/chat';
import type { Agent, AgentDetail } from '@/lib/api/explore';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Share2, MoreVertical, Edit2, Menu, Send } from 'lucide-react';
import { Tab, getTabs, getFeaturedAgents } from '@/lib/api/explore';
import { Sidebar } from '@/components/layout/Sidebar';

interface ChatItem {
  chat_id: string;
  title: string;
  timestamp: string;
}

interface ChatHistoryResponse {
  today: ChatItem[];
  previous_7_days: ChatItem[];
  previous_30_days: ChatItem[];
}

interface ApiChatResponse {
  id: string;
  chat_name: string;
  user_id: string;
  mode: string | null;
  created_at: string;
  last_updated: string;
}

interface NewChat {
  chatId: string;
  createdAt: string;
}

interface ExtendedAgent extends Omit<Agent, 'id'> {
  id: number;
  name: string;
  conversation_starters?: string[];
}

interface GetChatHistoryResponse {
  id: string;
  chat_name: string;
  user_id: string;
  mode: string | null;
  created_at: string;
  last_updated: string;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');
  const starter = searchParams.get('starter');
  const chatId = searchParams.get('chatId');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
  const [chats, setChats] = useState<ChatHistoryResponse>({
    today: [],
    previous_7_days: [],
    previous_30_days: []
  });
  const [activeChatTitle, setActiveChatTitle] = useState<string>('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTab, setSelectedTab] = useState('Top Picks');

  const loadChatDetail = async (userId: string, chatId: string) => {
    try {
      const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({
          userId: userId,
          chatId: chatId
        })
      });

      if (response.ok) {
        const data = await response.json();
        const transformedMessages = data.map((item: any) => ({
          id: item.id.toString(),
          content: item.message.content,
          role: item.message.type === 'human' ? 'user' : 'assistant',
          timestamp: new Date().toISOString()
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading chat detail:', error);
    }
  };

  const handleNewChat = async (agent: ExtendedAgent, userId: string, authToken: string): Promise<NewChat> => {
    const chatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        userId: userId,
        agentId: agent.id.toString(),
        agentName: agent.name
      })
    });

    if (!chatResponse.ok) {
      throw new Error('Failed to create new chat');
    }

    const chatData = await chatResponse.json();
    return {
      chatId: chatData.chatId.toString(),
      createdAt: chatData.createdAt
    };
  };

  const checkAuth = () => {
    const auth = localStorage.getItem('auth');
    if (!auth) {
      router.push('/login');
      return null;
    }
    try {
      const authData = JSON.parse(auth);
      if (!authData.token || !authData.user) {
        localStorage.removeItem('auth');
        router.push('/login');
        return null;
      }
      return authData;
    } catch (error) {
      localStorage.removeItem('auth');
      router.push('/login');
      return null;
    }
  };

  const transformApiResponse = (chatResponse: GetChatHistoryResponse[]): ChatHistoryResponse => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const today: ChatItem[] = [];
    const previous_7_days: ChatItem[] = [];
    const previous_30_days: ChatItem[] = [];

    chatResponse.forEach(chat => {
      const chatDate = new Date(chat.last_updated);
      const chatItem = {
        chat_id: chat.id,
        title: chat.chat_name || 'Untitled Chat',
        timestamp: chat.last_updated
      };

      if (chatDate >= oneDayAgo) {
        today.push(chatItem);
      } else if (chatDate >= sevenDaysAgo) {
        previous_7_days.push(chatItem);
      } else if (chatDate >= thirtyDaysAgo) {
        previous_30_days.push(chatItem);
      }
    });

    return {
      today: today.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      previous_7_days: previous_7_days.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      previous_30_days: previous_30_days.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    };
  };

  const findChat = (chatId: string | null, chats: ChatHistoryResponse) => {
    if (!chatId) return null;
    return chats.today.find(c => c.chat_id === chatId) ||
           chats.previous_7_days.find(c => c.chat_id === chatId) ||
           chats.previous_30_days.find(c => c.chat_id === chatId);
  };

  const handleChatUpdate = async () => {
    try {
      const chatResponse = await getChatHistory();
      const transformedResponse = transformApiResponse(chatResponse as GetChatHistoryResponse[]);
      setChats(transformedResponse);
      
      if (chatId) {
        const chat = findChat(chatId, transformedResponse);
        if (chat) {
          setActiveChatTitle(chat.title);
        }
      }
    } catch (error) {
      console.error('Error updating chat:', error);
    }
  };

  useEffect(() => {
    // Listen for chat update events
    window.addEventListener('chat-updated', handleChatUpdate);
    
    // Initial load
    handleChatUpdate();

    return () => {
      window.removeEventListener('chat-updated', handleChatUpdate);
    };
  }, [chatId]);

  useEffect(() => {
    if (chatId) {
      const chat = findChat(chatId, chats);
      if (chat) {
        setActiveChatTitle(chat.title);
      }
    } else if (selectedAgent) {
      setActiveChatTitle(selectedAgent.name);
    }
  }, [chatId, chats, selectedAgent]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const authData = checkAuth();
        if (!authData) return;

        // Load chat history first
        const chatResponse = await getChatHistory();
        const transformedResponse = transformApiResponse(chatResponse as GetChatHistoryResponse[]);
        setChats(transformedResponse);
        console.log('Chat history loaded:', transformedResponse); // Debug log

        // Load chat messages if chatId is present
        if (chatId) {
          await loadChatDetail(authData.user.id, chatId);
          const chat = findChat(chatId, transformedResponse);
          console.log('Current chat:', chat); // Debug log
          if (chat) {
            setActiveChatTitle(chat.title);
          }
        }

        // Load agent detail if agentId is present
        if (agentId && starter) {
          const agent = await getAgentDetail(parseInt(agentId));
          if (!agent) {
            throw new Error('Agent not found');
          }
          setSelectedAgent(agent as ExtendedAgent);
          setMessages([]); // Reset messages ketika agent baru dipilih

          // Cek apakah sudah ada chat dengan agent ini di session storage
          const existingChatId = sessionStorage.getItem(`chat_${agentId}`);
          
          if (existingChatId) {
            setSelectedChat(existingChatId);
            // Load chat messages jika ada
            await loadChatDetail(authData.user.id, existingChatId);
          } else {
            // Buat chat baru
            const newChat = await handleNewChat(agent as ExtendedAgent, authData.user.id, authData.token);
            setSelectedChat(newChat.chatId);
            
            // Simpan chatId ke session storage
            sessionStorage.setItem(`chat_${agentId}`, newChat.chatId);

            // Tambahkan chat baru ke daftar riwayat chat
            if (newChat.chatId) {
              setChats(prev => ({
                ...prev,
                today: [
                  {
                    chat_id: newChat.chatId,
                    title: agent.name,
                    timestamp: newChat.createdAt
                  },
                  ...prev.today
                ]
              }));
            }

            // Kirim starter message
            if (starter) {
              const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chatbot', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${authData.token}`
                },
                body: JSON.stringify({
                  message: decodeURIComponent(starter),
                  userId: authData.user.id,
                  chatId: newChat.chatId,
                  isAction: true,
                  timestamp: new Date().toISOString()
                })
              });

              if (response.ok) {
                const data = await response.json();
                const userMessage = {
                  id: Date.now().toString(),
                  content: decodeURIComponent(starter),
                  role: 'user' as const,
                  timestamp: new Date().toISOString()
                };
                const assistantMessage = {
                  id: (Date.now() + 1).toString(),
                  content: data[0].output,
                  role: 'assistant' as const,
                  timestamp: new Date().toISOString()
                };
                setMessages([userMessage, assistantMessage]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const auth = checkAuth();
    if (auth) {
      loadInitialData();
    }
  }, [router, agentId, starter, chatId]);

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

  const handleSendMessage = async (messageText?: string) => {
    if ((!messageText && !inputMessage.trim()) || isSending) return;
    
    const textToSend = messageText || inputMessage.trim();
    setIsSending(true);
    
    try {
      const auth = localStorage.getItem('auth');
      const authData = auth ? JSON.parse(auth) : null;
      const userId = authData?.user?.id;

      if (!userId || !authData?.token) {
        throw new Error('User ID or token not found');
      }

      const timestamp = new Date().toISOString();

      // Jika belum ada selectedChat, buat chat baru
      let currentChatId = selectedChat;
      if (!currentChatId && selectedAgent && agentId) {
        try {
          // Pastikan agent masih tersedia
          const agent = await getAgentDetail(parseInt(agentId));
          if (!agent) {
            throw new Error('Agent not found');
          }
          const newChat = await handleNewChat(agent as ExtendedAgent, userId, authData.token);
          currentChatId = newChat.chatId;
          setSelectedChat(currentChatId);

          // Tambahkan chat baru ke daftar riwayat chat
          setChats(prev => ({
            ...prev,
            today: [
              {
                chat_id: newChat.chatId,
                title: agent.name,
                timestamp: newChat.createdAt
              },
              ...prev.today
            ]
          }));
        } catch (error) {
          console.error('Error creating new chat:', error);
          throw error;
        }
      }

      if (!currentChatId) {
        throw new Error('No chat ID available');
      }
      
      const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          message: textToSend,
          userId: userId,
          chatId: currentChatId,
          isAction: true,
          timestamp: timestamp
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      const userMessage = {
        id: Date.now().toString(),
        content: textToSend,
        role: 'user' as const,
        timestamp: timestamp
      };
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        content: data[0].output,
        role: 'assistant' as const,
        timestamp: timestamp
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
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
      await handleChatUpdate();
      setIsRenaming(false);
      setNewTitle('');
    } catch (error) {
      console.error('Error renaming chat:', error);
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
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={20} className="text-gray-500" />
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {activeChatTitle || 'Chat'}
            </h2>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-8 overflow-y-auto">
          {!messages.length && selectedAgent && (
            <div className="max-w-4xl mx-auto text-center">
              <div className="mb-8">
                <img
                  src={selectedAgent.icon}
                  alt={selectedAgent.name}
                  className="w-16 h-16 rounded-full mx-auto mb-4"
                />
                <h1 className="text-4xl font-bold mb-2">{selectedAgent.name}</h1>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  {selectedAgent.description}
                </p>
              </div>

              <div className="max-w-2xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedAgent.conversation_starters?.map((starter: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(starter)}
                      className="text-left p-4 bg-white dark:bg-gray-900 hover:bg-purple-50 dark:hover:bg-gray-800/50 rounded-[20px] text-sm text-gray-600 dark:text-gray-400 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!selectedChat && !selectedAgent && (
            <div className="flex-1" />
          )}

          {messages.length > 0 && (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`${message.role === 'user' ? 'max-w-[80%]' : 'w-full'} p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-purple-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                    }`}
                  >
                    <ReactMarkdown
                      components={{
                        code: ({ className, children }) => (
                          <code className={className}>
                            {children}
                          </code>
                        )
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

        {/* Input Form - Bottom */}
        <div className="p-4">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="max-w-3xl mx-auto"
          >
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Chat dengan Write For Me..."
                className="w-full p-4 bg-[hsl(262,80%,98%)] dark:bg-[hsl(262,80%,10%)] text-gray-900 dark:text-white rounded-lg focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-4 p-2 text-gray-400 hover:text-gray-600"
                disabled={!inputMessage.trim()}
              >
                <Send className={`w-5 h-5 ${inputMessage.trim() ? 'text-[hsl(262,80%,45%)]' : ''}`} />
              </button>
            </div>
          </form>
          <p className="text-center mt-2 text-xs text-gray-500 dark:text-gray-400">
            Kamunaku AI dapat membuat kesalahan. Periksa informasi penting.
          </p>
        </div>

        {chatId && (
          <button
            onClick={() => chatId && handleRenameChat(chatId)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Edit2 size={20} className="text-gray-500" />
          </button>
        )}
      </main>
    </div>
  );
} 