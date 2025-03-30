'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getChatHistory, renameChat } from '@/lib/api/chat';
import { getAgentDetail } from '@/lib/api/explore';
import type { Agent, AgentDetail } from '@/lib/api/explore';
import type { Message, GetChatHistoryResponse } from '@/lib/api/chat';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Share2, MoreVertical, Edit2, Menu } from 'lucide-react';
import { Tab, getTabs, getFeaturedAgents } from '@/lib/api/explore';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');
  const starter = searchParams.get('starter');
  const chatId = searchParams.get('chatId');
  const [chats, setChats] = useState<GetChatHistoryResponse[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTab, setSelectedTab] = useState('Top Picks');

  const loadChatDetail = async (userId: string, chatId: string) => {
    try {
      const auth = localStorage.getItem('auth');
      const authData = auth ? JSON.parse(auth) : null;
      
      if (!authData?.token) {
        throw new Error('Auth token not found');
      }

      const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          userId: userId,
          chatId: chatId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat detail');
      }

      const data = await response.json();
      
      // Transform messages to our format
      const transformedMessages = data.map((item: any) => ({
        id: item.id.toString(),
        content: item.message.content,
        role: item.message.type === 'human' ? 'user' : 'assistant',
        timestamp: new Date().toISOString() // Since timestamp is not in the response
      }));

      setMessages(transformedMessages);
      setSelectedChat(chatId);
    } catch (error) {
      console.error('Error loading chat detail:', error);
    }
  };

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
        return authData;
      } catch (error) {
        localStorage.removeItem('auth');
        router.push('/login');
        return false;
      }
    };

    const loadInitialData = async () => {
      try {
        const authData = checkAuth();
        if (!authData) return;

        // Load chat history first
        const chatResponse = await getChatHistory();
        setChats(chatResponse);

        // Load agent detail if agentId is present
        if (agentId) {
          const agent = await getAgentDetail(parseInt(agentId));
          setSelectedAgent(agent);
          setMessages([]); // Reset messages ketika agent baru dipilih

          // Cek apakah sudah ada chat dengan agent ini di session storage
          const existingChatId = sessionStorage.getItem(`chat_${agentId}`);
          
          if (existingChatId) {
            setSelectedChat(existingChatId);
            // Load chat messages jika ada
            const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
              },
              body: JSON.stringify({
                userId: authData.user.id,
                chatId: existingChatId
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
          } else if (starter) {
            // Buat chat baru hanya jika belum ada dan ada starter message
            const chatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/new', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
              },
              body: JSON.stringify({
                userId: authData.user.id,
                agentId: agentId,
                agentName: agent.name
              })
            });

            if (!chatResponse.ok) {
              throw new Error('Failed to create new chat');
            }

            const chatData = await chatResponse.json();
            const newChatId = chatData.chatId;
            setSelectedChat(newChatId);
            
            // Simpan chatId ke session storage
            sessionStorage.setItem(`chat_${agentId}`, newChatId);

            // Tambahkan chat baru ke daftar riwayat chat
            const newChat: GetChatHistoryResponse = {
              id: newChatId,
              user_id: authData.user.id,
              chat_name: agent.name,
              mode: null,
              created_at: chatData.createdAt,
              last_updated: chatData.createdAt
            };
            setChats(prev => [newChat, ...prev]);

            // Kirim starter message
            const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chatbot', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.token}`
              },
              body: JSON.stringify({
                message: decodeURIComponent(starter),
                userId: authData.user.id,
                chatId: newChatId,
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
  }, [router, agentId, starter]);

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
      // Dapatkan userId dari localStorage
      const auth = localStorage.getItem('auth');
      const authData = auth ? JSON.parse(auth) : null;
      const userId = authData?.user?.id;

      if (!userId) {
        throw new Error('User ID not found');
      }

      const timestamp = new Date().toISOString();

      // Jika belum ada selectedChat, buat chat baru
      let chatId = selectedChat;
      if (!chatId && selectedAgent && agentId) {
        try {
          // Pastikan agent masih tersedia
          const agent = await getAgentDetail(parseInt(agentId));
          
          const chatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/new', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authData.token}`
            },
            body: JSON.stringify({
              userId: userId,
              agentId: agentId,
              agentName: agent.name
            })
          });

          if (!chatResponse.ok) {
            throw new Error('Failed to create new chat');
          }

          const chatData = await chatResponse.json();
          chatId = chatData.chatId;
          setSelectedChat(chatId);

          // Tambahkan chat baru ke daftar riwayat chat
          const newChat: GetChatHistoryResponse = {
            id: chatData.chatId,
            user_id: userId,
            chat_name: agent.name,
            mode: null,
            created_at: chatData.createdAt,
            last_updated: chatData.createdAt
          };
          setChats(prev => [newChat, ...prev]);
        } catch (error) {
          console.error('Error creating new chat:', error);
          throw error;
        }
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
          chatId: chatId,
          isAction: true,
          timestamp: timestamp
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Tambahkan pesan user ke state
      const userMessage = {
        id: Date.now().toString(),
        content: textToSend,
        role: 'user' as const,
        timestamp: timestamp
      };
      
      // Tambahkan respons assistant ke state
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
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <main className={`flex-1 flex flex-col transition-all duration-200 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4 px-4 py-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Menu size={20} className="text-gray-500" />
            </button>
            {selectedAgent && (
              <h2 className="font-semibold text-gray-900 dark:text-white">
                {selectedAgent.name}
              </h2>
            )}
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
                      className="text-left p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-[20px] text-sm text-gray-600 dark:text-gray-400 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
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
                    className={`max-w-[80%] p-4 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
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

        {/* Chat Input */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="max-w-3xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={selectedAgent ? `Chat dengan ${selectedAgent.name}...` : 'Ketik pesan...'}
                className="w-full p-4 pr-12 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending || !inputMessage.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? '...' : '→'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
} 