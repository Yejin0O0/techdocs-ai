'use client';

import { useCallback, useState } from 'react';

import { streamChat } from '@/lib/api';
import { ChatMessage } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (question: string) => {
      if (isLoading) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: question,
      };

      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: 'assistant',
        content: '',
        isStreaming: true,
      };

      // sendMessage 호출 시점의 messages를 history로 사용 (새 메시지 추가 전)
      const history = messages.map(({ role, content }) => ({ role, content }));

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);

      await streamChat(
        question,
        history,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        },
        (sources) => {
          setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, sources } : m)));
        },
        (errorMsg) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: errorMsg, isStreaming: false } : m
            )
          );
        }
      );

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      );
      setIsLoading(false);
    },
    [messages, isLoading]
  );

  return { messages, isLoading, sendMessage };
}
