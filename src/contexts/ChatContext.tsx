'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import type { Message } from '@/lib/api/chat';
import type { ChatHistory, ChatItem, ExtendedAgent } from '@/lib/api/explore';
import { useSidebar } from '@/contexts/SidebarContext';
import { API_BASE_URL } from '@/config/api';

interface ChatContextType {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  chats: ChatHistory;
  setChats: (chats: ChatHistory) => void;
  activeChatTitle: string;
  setActiveChatTitle: (title: string) => void;
  loadChatDetail: (userId: string, chatId: string) => Promise<void>;
  isDataFetched: boolean;
  setIsDataFetched: (value: boolean) => void;
  isAgentsFetched: boolean;
  setIsAgentsFetched: (value: boolean) => void;
  findChat: (chatId: string | null, chats: ChatHistory) => ChatItem | null;
  handleRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  selectedAgent: ExtendedAgent | null;
  setSelectedAgent: (agent: ExtendedAgent | null) => void;
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatHistory>({
    today: [],
    previous_7_days: [],
    previous_30_days: []
  });
  const [activeChatTitle, setActiveChatTitle] = useState('');
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isAgentsFetched, setIsAgentsFetched] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { chatHistory } = useSidebar();

  // Update chats whenever chatHistory changes
  useEffect(() => {
    setChats(chatHistory);
  }, [chatHistory]);

  const findChat = (chatId: string | null, chats: ChatHistory): ChatItem | null => {
    if (!chatId) return null;
    
    const todayChat = chats.today.find(c => c.chat_id.toString() === chatId);
    if (todayChat) return todayChat;
    
    const prev7DaysChat = chats.previous_7_days.find(c => c.chat_id.toString() === chatId);
    if (prev7DaysChat) return prev7DaysChat;
    
    const prev30DaysChat = chats.previous_30_days.find(c => c.chat_id.toString() === chatId);
    if (prev30DaysChat) return prev30DaysChat;
    
    return null;
  };

  const loadChatDetail = async (userId: string, chatId: string) => {
    try {
      // Ambil webhook_url dari detail chat
      const detailResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat/detail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!).token : ''}`
        },
        body: JSON.stringify({
          userId: userId,
          chatId: chatId
        })
      });

      if (!detailResponse.ok) {
        throw new Error('Failed to get chat detail');
      }

      const detailData = await detailResponse.json();
      const webhook_url = detailData[0]?.webhook_url;

      // Ambil riwayat chat
      const chatResponse = await fetch('https://coachbot-n8n-01.fly.dev/webhook/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!).token : ''}`
        },
        body: JSON.stringify({
          userId: userId,
          chatId: chatId
        })
      });

      if (chatResponse.ok) {
        const chatData = await chatResponse.json();
        if (Array.isArray(chatData) && chatData.length > 0) {
          const transformedMessages = chatData.map((item: any) => ({
            id: item.id.toString(),
            content: item.message.content,
            role: item.message.type === 'human' ? ('human' as const) : ('ai' as const),
            timestamp: new Date().toISOString(),
            webhook_url: webhook_url // Tambahkan webhook_url ke setiap pesan
          }));
          setMessages(transformedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading chat detail:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      console.log('=== START RENAME CHAT ===');
      console.log('Parameters:', { chatId, newTitle });
      console.log('Before rename - activeChatTitle:', activeChatTitle);
      
      const authData = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!) : null;
      if (!authData) return;

      const response = await fetch(`${API_BASE_URL}/chat/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
        },
        body: JSON.stringify({
          id: chatId,
          chatName: newTitle.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }

      // Update chat title di context
      setChats(prevChats => {
        console.log('Inside setChats - prevChats:', prevChats);
        const updatedChats = {
          ...prevChats,
          today: prevChats.today.map(chat => {
            if (chat.chat_id.toString() === chatId) {
              console.log('Found chat to rename in today:', chat);
              return { ...chat, title: newTitle.trim() };
            }
            return chat;
          }),
          previous_7_days: prevChats.previous_7_days.map(chat => {
            if (chat.chat_id.toString() === chatId) {
              console.log('Found chat to rename in previous_7_days:', chat);
              return { ...chat, title: newTitle.trim() };
            }
            return chat;
          }),
          previous_30_days: prevChats.previous_30_days.map(chat => {
            if (chat.chat_id.toString() === chatId) {
              console.log('Found chat to rename in previous_30_days:', chat);
              return { ...chat, title: newTitle.trim() };
            }
            return chat;
          })
        };
        return updatedChats;
      });

      // Update active chat title jika chat yang di-rename adalah chat yang sedang aktif
      const currentChat = findChat(chatId, chats);
      if (currentChat && activeChatTitle === currentChat.title) {
        console.log('Updating activeChatTitle to:', newTitle.trim());
        setActiveChatTitle(newTitle.trim());
      }

      console.log('=== END RENAME CHAT ===');
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      messages, 
      setMessages, 
      chats,
      setChats,
      activeChatTitle, 
      setActiveChatTitle,
      loadChatDetail,
      isDataFetched,
      setIsDataFetched,
      isAgentsFetched,
      setIsAgentsFetched,
      findChat,
      handleRenameChat,
      selectedAgent,
      setSelectedAgent,
      selectedChat,
      setSelectedChat
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 