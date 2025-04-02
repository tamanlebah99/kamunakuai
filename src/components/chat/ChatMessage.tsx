'use client';

import { UserCircleIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
}

export default function ChatMessage({ message, isUser, timestamp }: ChatMessageProps) {
  return (
    <div
      className={clsx(
        "flex items-start mb-6",
        isUser ? "justify-end" : "justify-start w-full"
      )}
    >
      {!isUser ? (
        <div className="w-full bg-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed py-3 px-8">
              <ReactMarkdown>{message}</ReactMarkdown>
              <div className="text-[11px] mt-2 text-gray-400">
                {timestamp}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col gap-1 md:gap-3 bg-[#F3F4F6] dark:bg-gray-800 px-4 py-3 rounded-lg max-w-[70%]">
          <div className="text-[14px] text-gray-700 dark:text-gray-300 leading-relaxed">
            <ReactMarkdown>{message}</ReactMarkdown>
          </div>
          <div className="text-[11px] mt-2 text-gray-500">
            {timestamp}
          </div>
        </div>
      )}
    </div>
  );
} 