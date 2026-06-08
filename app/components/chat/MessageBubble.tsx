'use client';

import ReactMarkdown from 'react-markdown';

import { Skeleton } from '@/components/ui/skeleton';
import { ChatMessage, ChatSource } from '@/types';

import SourceBadge from './SourceBadge';

interface Props {
  message: ChatMessage;
  onBadgeClick?: (source: ChatSource) => void;
  onRetry?: () => void;
}

export default function MessageBubble({ message, onBadgeClick, onRetry }: Props) {
  const isUser = message.role === 'user';
  const isSkeleton = !isUser && message.isStreaming && message.content === '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
            : message.isError
              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
              : 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
        }`}
      >
        {isSkeleton ? (
          <div className="space-y-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.isStreaming && !isSkeleton && (
          <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-current" />
        )}

        {message.isError && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-red-500 underline underline-offset-2 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            재시도
          </button>
        )}

        {!message.isStreaming &&
          !message.isError &&
          message.sources &&
          message.sources.length > 0 && (
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
