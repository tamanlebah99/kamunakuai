'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { renameChat, deleteChat } from '@/lib/api/chat';
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
import { useChat } from '@/contexts/ChatContext';
import { checkAuth } from '@/lib/auth';
import clsx from 'clsx';
import { Components } from 'react-markdown';

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
  webhook_url: string;
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

interface CodeProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const Code: React.FC<CodeProps> = ({ inline = false, className, children }) => {
  const match = /language-(\w+)/.exec(className || '');
  return !inline && match ? (
    <pre className="relative">
      <code className={className}>{children}</code>
    </pre>
  ) : (
    <code className={className}>{children}</code>
  );
};

const markdownComponents: Components = {
  code: ({ className, children }) => {
    const match = /language-(\w+)/.exec(className || '');
    return match ? (
      <SyntaxHighlighter
        style={tomorrow as any}
        language={match[1]}
        PreTag="div"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className}>{children}</code>
    );
  }
};

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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('agent');
  const starter = searchParams.get('starter');
  const chatId = searchParams.get('chatId');
  const isFromRecent = searchParams.get('_src') === '1dw3y';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab>({ category_id: 1, category_name: 'Pengembangan Diri', sequence: 1 });

  const lastFetchedChatId = useRef<string | null>(null);
  const lastFetchedSource = useRef<string | null>(null);
  const isInitialMount = useRef(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get chat state from context
  const { 
    messages, 
    setMessages: setMessagesContext, 
    chats,
    setChats,
    activeChatTitle, 
    setActiveChatTitle,
    isDataFetched,
    setIsDataFetched,
    isAgentsFetched,
    setIsAgentsFetched,
    loadChatDetail,
    findChat,
    handleRenameChat
  } = useChat();

  // Local state for messages
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Update local messages when context messages change
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Effect untuk load chat detail ketika chatId berubah
  useEffect(() => {
    if (!chatId) {
      // Jika tidak ada chatId (berarti di halaman agent), 
      // dan ada agent yang dipilih, gunakan nama agent sebagai judul
      if (selectedAgent) {
        setActiveChatTitle(selectedAgent.name);
      }
      return;
    }
    if (selectedChat === chatId) return; // Prevent loop if chat is already selected

    const fetchChatDetail = async () => {
      try {
        const authData = checkAuth();
        if (!authData) return;

        setIsLoading(true);
        await loadChatDetail(authData.user.id, chatId);
        setSelectedChat(chatId);

        // Set chat title dari chat history
        const chat = findChat(chatId, chats);
        if (chat) {
          setActiveChatTitle(chat.title);
        }
      } catch (error) {
        console.error('Error loading chat detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatDetail();
  }, [chatId, loadChatDetail, chats, setActiveChatTitle, findChat, selectedChat, selectedAgent]);

  // Effect untuk update judul chat ketika chat di-rename
  useEffect(() => {
    if (!selectedChat) return;
    
    const chat = findChat(selectedChat, chats);
    if (chat) {
      setActiveChatTitle(chat.title);
    }
  }, [chats, selectedChat, findChat, setActiveChatTitle]);

  // Reset fetch flags when navigating away
  useEffect(() => {
    return () => {
      if (pathname !== '/chat' && pathname !== '/explore') {
        setIsDataFetched(false);
        setIsAgentsFetched(false);
        lastFetchedChatId.current = null;
        lastFetchedSource.current = null;
        isInitialMount.current = true;
      }
    };
  }, [pathname, setIsDataFetched, setIsAgentsFetched]);

  // Effect untuk load agent detail dan buat chat baru
  useEffect(() => {
    if (!agentId) return;
    
    const loadAgentDetail = async () => {
      try {
        const authData = checkAuth();
        if (!authData) return;

        setIsLoading(true);

        const agentDetail = await getAgentDetail(agentId);
        if (!agentDetail) {
          throw new Error('Agent not found');
        }

        const newAgent = {
          id: agentDetail.id,
          name: agentDetail.name,
          description: agentDetail.description,
          provider: agentDetail.provider,
          rating: agentDetail.rating,
          category: agentDetail.category,
          conversation_count: agentDetail.conversation_count,
          conversation_starters: agentDetail.conversation_starters,
          icon_url: agentDetail.icon_url,
          webhook_url: agentDetail.webhook_url
        };

        setSelectedAgent(newAgent);
        setActiveChatTitle(agentDetail.name);
        setSelectedChat(null);
        setMessagesContext([]);

      } catch (error) {
        console.error('Error loading agent detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentDetail();
  }, [agentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSendMessage = async (messageText?: string) => {
    try {
      const authData = checkAuth();
      if (!authData) return;

      const message = messageText || inputMessage;
      if (!message.trim() || !selectedAgent) return;

      setInputMessage('');
      
      // Tambahkan pesan user ke context
      const userMessage = {
        role: 'human',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessagesContext(prev => [...prev, userMessage]);
      
      // Gunakan chatId yang ada atau selectedChat yang sudah ada
      let currentChatId = chatId || selectedChat;

      // Buat chat baru hanya jika belum ada chatId sama sekali
      if (!currentChatId) {
        const newChatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/newid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({
            userId: authData.user.id,
            agentId: selectedAgent.id,
            chatName: selectedAgent.name,
            agentName: selectedAgent.name
          })
        });

        if (!newChatResponse.ok) {
          throw new Error('Failed to create new chat');
        }

        const newChatData = await newChatResponse.json();
        currentChatId = newChatData.chatId;
        setSelectedChat(currentChatId);
        setActiveChatTitle(selectedAgent.name);
      }

      // Kirim pesan ke agent
      const response = await fetch(selectedAgent.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          userId: authData.user.id,
          chatId: currentChatId,
          message: message,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const aiMessage = {
        role: 'ai',
        content: data[0].output,
        timestamp: new Date().toISOString()
      };
      setMessagesContext(prev => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleConversationStarterClick = async (starter: string) => {
    try {
      const authData = checkAuth();
      if (!authData || !selectedAgent) return;

      setIsLoading(true);

      // Gunakan chatId yang ada atau buat baru jika belum ada
      let currentChatId = chatId || selectedChat;

      if (!currentChatId) {
        const newChatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/newid', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authData.token}`
          },
          body: JSON.stringify({
            userId: authData.user.id,
            agentId: selectedAgent.id,
            chatName: selectedAgent.name,
            agentName: selectedAgent.name
          })
        });

        if (!newChatResponse.ok) {
          throw new Error('Failed to create new chat');
        }

        const newChatData = await newChatResponse.json();
        currentChatId = newChatData.chatId;
        setSelectedChat(currentChatId);
        setActiveChatTitle(selectedAgent.name);
      }

      // Kirim pesan ke agent
      const response = await fetch(selectedAgent.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          userId: authData.user.id,
          chatId: currentChatId,
          message: starter,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const messages = [
        { 
          role: 'human', 
          content: starter,
          timestamp: new Date().toISOString()
        },
        { 
          role: 'ai', 
          content: data[0].output,
          timestamp: new Date().toISOString()
        }
      ];
      setMessagesContext(messages);

    } catch (error) {
      console.error('Error handling conversation starter:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameCurrentChat = async () => {
    if (!selectedChat || !newTitle.trim()) return;

    try {
      await handleRenameChat(selectedChat, newTitle.trim());
      setIsRenaming(false);
      setNewTitle('');
    } catch (error) {
      console.error('Error renaming chat:', error);
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
      const authData = checkAuth();
      if (!authData) return;

      const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          chatId: chatId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to delete chat');
      }

      if (chatId === selectedChat) {
        router.push('/chat');
        setMessagesContext([]);
        setSelectedChat(null);
        setActiveChatTitle('');
      }

      // Trigger chat update to refresh the sidebar
      // window.dispatchEvent(new Event('chat-updated'));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleAgentClick = (agent: ExtendedAgent) => {
    router.push(`/chat?agent=${agent.id}`);
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
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className={clsx(
        "flex flex-col flex-1 h-screen",
        isSidebarOpen ? "md:pl-64" : ""
      )}>
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
          <div className="max-w-3xl mx-auto">
            {localMessages.length === 0 ? (
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
                          onClick={() => handleConversationStarterClick(starter)}
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
              <>
                {localMessages.map((message, index) => (
                  <div
                    key={message.id || `message-${index}`}
                    className={clsx(
                      "flex items-start mb-6",
                      message.role === 'ai' ? "justify-start" : "justify-end"
                    )}
                  >
                    {message.role === 'ai' ? (
                      <div className="w-full bg-white">
                        <div className="text-[14px] text-gray-700 leading-relaxed py-3 px-8">
                          <ReactMarkdown components={markdownComponents}>
                            {message.content}
                          </ReactMarkdown>
                          <div className="text-[11px] mt-2 text-gray-400">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#f9f6fe] px-4 py-3 rounded-lg max-w-[70%]">
                        <div className="text-[14px] text-gray-700 leading-relaxed">
                          <ReactMarkdown components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                        <div className="text-[11px] mt-2 text-gray-500">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                  )}
                </div>
                ))}
                <div ref={messagesEndRef} />
              </>
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
                if (inputMessage.trim()) {
                handleSendMessage();
                }
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
                className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-[14px] text-gray-700 dark:text-gray-300"
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
      </div>
    </div>
  );
} 