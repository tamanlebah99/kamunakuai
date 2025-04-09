'use client';

import ReactMarkdown from 'react-markdown';
import type { Message } from '@/lib/api/chat';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'ai') {
    return (
      <div className="w-full bg-white dark:bg-gray-900">
        <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed p-4">
          <div className="prose prose-sm prose-gray dark:prose-invert max-w-none chat-message">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f6fe] dark:bg-gray-800 p-4 rounded-2xl max-w-[70%]">
      <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
        <div className="prose prose-sm prose-gray dark:prose-invert max-w-none chat-message">
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
} 