'use client';

import { useCallback, useState } from 'react';

import { ChatSource } from '@/types';

interface PanelData {
  source: ChatSource;
  question: string;
}

export function useSourcePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [panelData, setPanelData] = useState<PanelData | null>(null);

  const openPanel = useCallback((source: ChatSource, question: string) => {
    setPanelData({ source, question });
    setIsOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    selectedSource: panelData?.source ?? null,
    selectedQuestion: panelData?.question ?? '',
    isOpen,
    openPanel,
    closePanel,
  };
}
