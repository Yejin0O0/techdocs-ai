'use client';

import { useEffect, useRef, useState } from 'react';

import { useChat } from '@/app/hooks/useChat';
import { useSourcePanel } from '@/app/hooks/useSourcePanel';

import MessageBubble from './MessageBubble';
import SourcePanel from './SourcePanel';

export default function ChatWindow() {
  const { messages, isLoading, sendMessage } = useChat();
  const { selectedSource, selectedQuestion, isOpen, openPanel, closePanel } = useSourcePanel();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    sendMessage(question);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  }

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-zinc-400">업로드된 문서에 대해 질문해보세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const questionMap = new Map<string, string>();
                let lastQuestion = '';
                for (const m of messages) {
                  if (m.role === 'user') lastQuestion = m.content;
                  else questionMap.set(m.id, lastQuestion);
                }
                return messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    message={m}
                    onBadgeClick={(source) => openPanel(source, questionMap.get(m.id) ?? '')}
                  />
                ));
              })()}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <div className="flex gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="질문을 입력하세요... (Enter 전송 / Shift+Enter 줄바꿈)"
              rows={1}
              className="max-h-40 flex-1 resize-none overflow-y-auto rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isLoading ? '답변 중...' : '전송'}
            </button>
          </div>
        </form>
      </div>

      {selectedSource && (
        <SourcePanel
          source={selectedSource}
          question={selectedQuestion}
          isOpen={isOpen}
          onClose={closePanel}
        />
      )}
    </div>
  );
}
