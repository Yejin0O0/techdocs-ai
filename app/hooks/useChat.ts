'use client';

import { useCallback, useState } from 'react';

import { streamChat } from '@/lib/api';
import { ChatMessage } from '@/types';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (question: string, historyOverride?: ChatMessage[]) => {
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

      const history = (historyOverride ?? messages).map(({ role, content }) => ({ role, content }));

      setLastQuestion(question);
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);

      try {
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
                m.id === assistantId
                  ? { ...m, content: errorMsg, isStreaming: false, isError: true }
                  : m
              )
            );
          }
        );
      } finally {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
        );
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const retryLastMessage = useCallback(() => {
    if (!lastQuestion || isLoading) return;
    const trimmed = messages.slice(0, -2);
    setMessages(trimmed);
    sendMessage(lastQuestion, trimmed);
  }, [lastQuestion, isLoading, messages, sendMessage]);

  return { messages, isLoading, sendMessage, retryLastMessage };
}
