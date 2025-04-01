'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getChatHistory, renameChat, deleteChat } from '@/lib/api/chat';
import { getAgentDetail } from '@/lib/api/explore';
import { getAuthToken } from '@/lib/utils/auth';
import type { Message } from '@/lib/api/chat';
import type { Agent, AgentDetail } from '@/lib/api/explore';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Share2, MoreVertical, Edit2, Menu, Send, Plus, Globe, Lightbulb, MoreHorizontal, ArrowUp, Trash2 } from 'lucide-react';
import { Tab, getTabs, getFeaturedAgents } from '@/lib/api/explore';
import { Sidebar } from '@/components/layout/Sidebar';
import Image from 'next/image';

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
  id: string;
  category: string;
  conversation_count: number;
  conversation_starters: string[];
  rating: string;
  provider: string;
  description: string;
  icon_url: string;
  name: string;
}

interface GetChatHistoryResponse {
  id: string;
  chat_name: string;
  user_id: string;
  mode: string | null;
  created_at: string;
  last_updated: string;
}

interface MessageResponse {
  id: string;
  message?: {
    content: string;
    type: string;
  };
  output?: string;
}

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen">
      <Suspense fallback={<div>Loading...</div>}>
        <ChatContent />
      </Suspense>
    </div>
  );
}

function ChatContent() {
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
  const [selectedTab, setSelectedTab] = useState<Tab>({ category_id: 1, category_name: 'Pengembangan Diri', sequence: 1 });

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
        if (Array.isArray(data) && data.length > 0) {
          const transformedMessages = data.map((item: MessageResponse) => ({
            id: item.id?.toString() || Date.now().toString(),
            content: item.message?.content || item.output || '',
            role: (item.message?.type === 'human' ? 'user' : 'assistant') as 'user' | 'assistant',
            timestamp: new Date().toISOString()
          }));
          setMessages(transformedMessages);
        }
      }
    } catch (err) {
      console.error('Error loading chat detail:', err);
    }
  };

  const handleNewChat = async (agent: ExtendedAgent, userId: string, token: string) => {
    try {
      const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          agentId: agent.id,
          chatName: agent.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create new chat');
      }

      const data = await response.json();
      return {
        chatId: data.chatId,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating new chat:', error);
      throw error;
    }
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
        if (agentId) {
          try {
            const chatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/new', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
              },
              body: JSON.stringify({
                userId: authData.user.id,
                agentId: agentId
              })
            });

            if (!chatResponse.ok) {
              throw new Error('Failed to get agent template');
            }

            const data = await chatResponse.json();
            const agentData = Array.isArray(data) ? data[0] : data;
            
            setSelectedAgent({
              id: agentData.id,
              name: agentData.name,
              description: agentData.description,
              provider: agentData.provider,
              rating: agentData.rating,
              category: agentData.category,
              conversation_count: agentData.conversation_count,
              conversation_starters: agentData.conversation_starters,
              icon_url: agentData.icon_url
            });
            setMessages([]); // Reset messages ketika agent baru dipilih

            // Simpan chatId ke session storage
            if (agentData.chatid) {
              sessionStorage.setItem(`chat_${agentId}`, agentData.chatid);
              setSelectedChat(agentData.chatid);
            }

            // Kirim starter message jika ada
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
                  chatId: agentData.chatid,
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
          } catch (error) {
            console.error('Error loading agent template:', error);
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
        const response = await getFeaturedAgents(selectedTab.category_id);
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

      // Jika belum ada selectedChat atau chatId, buat chat baru
      let currentChatId = selectedChat || chatId;
      
      if (!currentChatId) {
        // Jika tidak ada agent yang dipilih, gunakan agent default atau tampilkan pesan error
        if (!selectedAgent && !agentId) {
          throw new Error('Silakan pilih agent terlebih dahulu');
        }

        try {
          // Dapatkan chatId baru dari webhook/chat/newid
          const newChatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/newid', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify({
              userId: userId,
              agentId: selectedAgent?.id || agentId,
              agentName: selectedAgent?.name || 'Unknown Agent'
            })
          });

          if (!newChatResponse.ok) {
            throw new Error('Gagal membuat chat baru');
          }

          const newChatData = await newChatResponse.json();
          currentChatId = newChatData.chatId;
          setSelectedChat(currentChatId);

          // Update URL dengan chatId baru
          router.push(`/chat?chatId=${currentChatId}`, { scroll: false });
        } catch (error) {
          console.error('Error creating new chat:', error);
          throw error;
        }
      }

      if (!currentChatId) {
        throw new Error('Tidak dapat membuat chat baru');
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
        throw new Error('Gagal mengirim pesan');
      }

      const data = await response.json();
      
      // Refresh chat history sebelum update messages
      await handleChatUpdate();
      
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
    } catch (error: any) {
      console.error('Error sending message:', error);
      // Tampilkan pesan error ke user
      alert(error.message || 'Terjadi kesalahan saat mengirim pesan');
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

  const handleDeleteChat = async (chatId: string) => {
    try {
      const auth = checkAuth();
      if (!auth) return;

      await deleteChat(auth.user.id, chatId);
      
      // Refresh chat list
      await handleChatUpdate();
      
      // If the deleted chat was active, redirect to home
      if (chatId === selectedChat) {
        router.push('/chat');
        setMessages([]);
        setSelectedChat(null);
        setActiveChatTitle('');
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
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
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[60vh]">
                {selectedAgent && (
                  <>
                    <img
                      src={selectedAgent.icon_url}
                      alt={selectedAgent.name}
                      className="w-16 h-16 rounded-full mb-4 bg-gray-100"
                    />
                    <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                      {selectedAgent.name}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
                      By {selectedAgent.provider}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-6">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{selectedAgent.rating}</span>
                        <span className="text-yellow-500">★</span>
                      </div>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <span>#{1} in {selectedAgent.category}</span>
                      <span className="text-gray-300 dark:text-gray-700">|</span>
                      <span>{(selectedAgent.conversation_count / 1000000).toFixed(0)}M+ Conversations</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                      {selectedAgent.description}
                    </p>
                  </>
                )}

                {selectedAgent?.conversation_starters && (
                  <div className="w-full max-w-xl">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Conversation Starters
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedAgent.conversation_starters.map((starter, index) => (
                        <button
                          key={index}
                          onClick={() => handleSendMessage(starter)}
                          className="text-left p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-[20px] text-sm text-gray-600 dark:text-gray-400 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                        >
                          {starter}
                        </button>
                  ))}
                </div>
                  </div>
                )}
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`${
                    message.role === 'user' 
                      ? 'flex w-full flex-col gap-1 empty:hidden items-end rtl:items-start'
                      : 'flex items-start empty:hidden'
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl text-sm ${
                      message.role === 'user'
                        ? 'bg-[hsl(262,80%,95%)] text-gray-700'
                        : 'bg-white dark:bg-gray-800 flex-1'
                    }`}
                    style={message.role === 'user' ? { maxWidth: '75%' } : undefined}
                  >
                    <ReactMarkdown
                      components={{
                        code({ inline, className, children }) {
                          const match = /language-(\w+)/.exec(className || '');
                          return !inline && match ? (
                            <SyntaxHighlighter
                              style={tomorrow as any}
                              language={match[1]}
                              PreTag="div"
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          ) : (
                            <code className={className}>
                              {children}
                            </code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8" />
                  )}
                </div>
              ))
            )}

            {isSending && (
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 dark:border-gray-400 border-t-transparent"></div>
                <span>Mengirim...</span>
            </div>
          )}
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden"
            >
              <div className="flex items-center gap-2 p-2">
                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <Plus size={20} className="text-gray-500" />
                </button>
                
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-gray-700 dark:text-gray-300"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
              </div>

              <div className="flex items-center gap-2 px-2 pb-2">
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <Globe size={16} />
                  <span>Search</span>
                </button>
                
                <button
                  type="button"
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <Lightbulb size={16} />
                  <span>Reason</span>
                </button>

                <button
                  type="button"
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                >
                  <MoreHorizontal size={16} className="text-gray-500" />
                </button>

              <button
                  type="button"
                  className="p-2 bg-black hover:bg-gray-900 rounded-full ml-auto"
              >
                  <ArrowUp size={16} className="text-white" />
              </button>
            </div>
          </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Kamunaku AI dapat membuat kesalahan. Periksa informasi penting.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
} 