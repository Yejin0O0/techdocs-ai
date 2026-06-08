'use client';

import FileUploader from '@/app/components/upload/FileUploader';
import FileList from '@/app/components/upload/FileList';
import ChatWindow from '@/app/components/chat/ChatWindow';
import { useDocuments } from '@/app/hooks/useDocuments';
import { useMobileTab } from '@/app/hooks/useMobileTab';

export default function Home() {
  const { documents, handleUpload, handleRetry, handleDelete, checkDuplicates } = useDocuments();
  const { activeTab, setActiveTab } = useMobileTab();

  return (
    <div className="flex flex-1 overflow-hidden bg-white dark:bg-zinc-950">
      {/* 모바일 탭 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
        {(['chat', 'upload'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-400 dark:text-zinc-500'
            }`}
          >
            {tab === 'chat' ? '채팅' : '문서'}
          </button>
        ))}
      </div>

      {/* 사이드바 — 데스크탑 항상 표시 / 모바일 upload 탭일 때 표시 */}
      <aside
        className={`flex w-full flex-col gap-4 border-r border-zinc-200 p-6 pb-16 dark:border-zinc-800 md:flex md:w-80 md:shrink-0 md:pb-6 ${
          activeTab === 'upload' ? 'flex' : 'hidden'
        } md:flex`}
      >
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">문서</h2>
        <FileUploader onUpload={handleUpload} checkDuplicates={checkDuplicates} />
        <div className="flex-1 overflow-y-auto">
          <FileList documents={documents} onRetry={handleRetry} onDelete={handleDelete} />
        </div>
      </aside>

      {/* 채팅 — 데스크탑 항상 표시 / 모바일 chat 탭일 때 표시 */}
      <main
        className={`flex-1 overflow-hidden pb-12 md:pb-0 ${
          activeTab === 'chat' ? 'flex' : 'hidden'
        } md:flex`}
      >
        <ChatWindow />
      </main>
    </div>
  );
}
