'use client';

import ReactMarkdown from 'react-markdown';
import type { Message } from '@/lib/api/chat';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  if (message.role === 'ai') {
    return (
      <div className="w-full bg-white">
        <div className="text-[14px] text-gray-700 leading-relaxed py-3 px-8">
          <div className="prose prose-sm prose-gray max-w-none chat-message">
            <ReactMarkdown>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f9f6fe] px-4 py-3 rounded-lg max-w-[70%]">
      <div className="text-[14px] text-gray-700 leading-relaxed">
        <div className="prose prose-sm prose-gray max-w-none chat-message">
          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
} 