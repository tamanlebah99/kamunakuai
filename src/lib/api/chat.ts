import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/lib/utils/auth';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface ChatHistory {
  id: string;
  user_id: string;
  chat_name: string | null;
  mode: string | null;
  created_at: string;
  last_updated: string;
}

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: string;
}

interface SendMessageResponse {
  message: ChatMessage;
}

interface GetChatHistoryResponse {
  chats: ChatHistory[];
}

interface GetChatMessagesResponse {
  messages: Message[];
}

// Helper untuk mendapatkan user data
const getAuthData = () => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  return auth;
};

export async function sendMessage(chatId: string | null, content: string): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({
      chat_id: chatId,
      message: content,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return await response.json();
}

export async function getChatHistory(): Promise<GetChatHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/history`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get chat history');
  }

  return await response.json();
}

export async function getChatMessages(chatId: string): Promise<GetChatMessagesResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Gagal mengambil pesan chat');
  }

  return response.json();
}

export async function renameChat(chatId: string, newTitle: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/rename`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({
      chat_id: chatId,
      new_title: newTitle,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to rename chat');
  }
}

export async function deleteChat(chatId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Gagal menghapus chat');
  }
} 