'use client';

import ReactMarkdown from 'react-markdown';

import { ChatMessage, ChatSource } from '@/types';

import SourceBadge from './SourceBadge';

interface Props {
  message: ChatMessage;
  onBadgeClick?: (source: ChatSource) => void;
}

export default function MessageBubble({ message, onBadgeClick }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.isStreaming && (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-current" />
        )}

        {!message.isStreaming && message.sources && message.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1 border-t border-zinc-200 pt-2 dark:border-zinc-700">
            {message.sources.map((source, i) => (
              <SourceBadge
                key={`${source.fileName}-${source.page ?? i}`}
                source={source}
                onClick={() => onBadgeClick?.(source)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
