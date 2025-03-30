import { Agent } from '@/types/agent';

interface AgentCardProps {
  agent: Agent;
  onClick?: () => void;
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  return (
    <div
      className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <img
        src={agent.icon}
        alt={agent.name}
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {agent.name}
          </h3>
          {agent.rating && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {agent.rating} ★
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
          {agent.description}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
          By {agent.provider}
        </p>
      </div>
    </div>
  );
} 