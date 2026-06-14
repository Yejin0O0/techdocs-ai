'use client';

import ChatWindow from '@/app/components/chat/ChatWindow';
import StatsPanel from '@/app/components/stats/StatsPanel';
import FileList from '@/app/components/upload/FileList';
import FileUploader from '@/app/components/upload/FileUploader';
import { useDocuments } from '@/app/hooks/useDocuments';
import { useMobileTab } from '@/app/hooks/useMobileTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

      {/* 사이드바 */}
      <aside
        className={`flex w-full flex-col border-r border-zinc-200 dark:border-zinc-800 md:flex md:w-80 md:shrink-0 ${
          activeTab === 'upload' ? 'flex' : 'hidden'
        } md:flex`}
      >
        <Tabs defaultValue="files" className="flex flex-1 flex-col overflow-hidden">
          <div className="px-6 pt-6">
            <TabsList
              variant="line"
              className="h-auto w-full gap-0 rounded-none border-b border-zinc-200 bg-transparent p-0 dark:border-zinc-800"
            >
              <TabsTrigger value="files" className="rounded-none pb-2 text-xs after:bottom-[-1px]">
                파일 목록
              </TabsTrigger>
              <TabsTrigger value="stats" className="rounded-none pb-2 text-xs after:bottom-[-1px]">
                통계
              </TabsTrigger>
            </TabsList>
          </div>
          <TabsContent
            value="files"
            className="flex flex-1 flex-col gap-4 overflow-hidden px-6 pb-16 pt-4 md:pb-6"
          >
            <FileUploader onUpload={handleUpload} checkDuplicates={checkDuplicates} />
            <div className="flex-1 overflow-y-auto">
              <FileList documents={documents} onRetry={handleRetry} onDelete={handleDelete} />
            </div>
          </TabsContent>
          <TabsContent value="stats" className="flex-1 overflow-y-auto px-6 pb-16 pt-4 md:pb-6">
            <StatsPanel documents={documents} />
          </TabsContent>
        </Tabs>
      </aside>

      {/* 채팅 */}
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
