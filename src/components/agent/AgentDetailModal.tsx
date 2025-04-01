'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Agent, AgentDetail, getAgentDetail } from '@/lib/api/explore';
import { useRouter } from 'next/navigation';

interface AgentDetailModalProps {
  agent: Agent;
  onClose: () => void;
  onStartChat: () => void;
}

export function AgentDetailModal({ agent, onClose, onStartChat }: AgentDetailModalProps) {
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadAgentDetail = async () => {
      try {
        const detail = await getAgentDetail(agent.id);
        setAgentDetail(detail);
      } catch (error) {
        console.error('Error loading agent detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentDetail();
  }, [agent.id]);

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-50" />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-8 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl z-50">
        {/* Header */}
        <div className="flex justify-between items-center p-4">
          <div className="w-8" /> {/* Spacer */}
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {/* Agent Info */}
          <div className="flex flex-col items-center text-center mb-8">
            <img
              src={agent.icon_url}
              alt={agent.name}
              className="w-16 h-16 rounded-full mb-4 bg-gray-100 dark:bg-gray-800"
            />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {agent.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              By {agent.provider}
            </p>
            {agentDetail?.rating && (
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{agentDetail.rating}</span>
                  <span className="text-yellow-500">★</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span>#{1} in {agentDetail.category}</span>
                <span className="text-gray-300 dark:text-gray-700">|</span>
                <span>{(agentDetail.conversation_count / 1000000).toFixed(0)}M+ Conversations</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            {agent.description}
          </p>

          {/* Conversation Starters */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Conversation Starters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {agentDetail?.conversation_starters.map((starter, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onStartChat();
                    router.push(`/chat?agent=${agent.id}&starter=${encodeURIComponent(starter)}`);
                  }}
                  className="text-left p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-[20px] text-sm text-gray-600 dark:text-gray-400 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {/* Start Chat Button */}
          <button
            onClick={() => {
              onStartChat();
              router.push(`/chat?agent=${agent.id}`);
            }}
            className="w-full mt-8 py-3 px-4 bg-black dark:bg-white text-white dark:text-black rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle size={20} />
            <span>Mulai Chat</span>
          </button>
        </div>
      </div>
    </>
  );
} 