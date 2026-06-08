'use client';

import { useState } from 'react';

type Tab = 'chat' | 'upload';

export function useMobileTab() {
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return { activeTab, setActiveTab };
}
