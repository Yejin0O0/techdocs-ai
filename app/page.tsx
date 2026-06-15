'use client';

import ChatWindow from '@/app/components/chat/ChatWindow';
import StatsPanel from '@/app/components/stats/StatsPanel';
import FileList from '@/app/components/upload/FileList';
import FileUploader from '@/app/components/upload/FileUploader';
import GithubInput from '@/app/components/upload/GithubInput';
import SlackSettings from '@/app/components/upload/SlackSettings';
import { useDocuments } from '@/app/hooks/useDocuments';
import { useMobileTab } from '@/app/hooks/useMobileTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Home() {
  const {
    documents,
    handleUpload,
    handleRetry,
    handleDelete,
    handleGithubIndex,
    checkDuplicates,
    checkDuplicateRepo,
  } = useDocuments();
  const { activeTab, setActiveTab } = useMobileTab();

  return (
    <div className="flex flex-1 overflow-hidden bg-white dark:bg-zinc-950">
      {/* 모바일 탭 네비게이션 */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:hidden">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'chat' | 'upload')}>
          <TabsList
            variant="line"
            className="h-12 w-full gap-0 rounded-none border-none bg-transparent p-0"
          >
            <TabsTrigger
              value="chat"
              className="h-full flex-1 rounded-none text-xs after:hidden data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
            >
              채팅
            </TabsTrigger>
            <TabsTrigger
              value="upload"
              className="h-full flex-1 rounded-none text-xs after:hidden data-active:bg-transparent data-active:shadow-none dark:data-active:border-transparent dark:data-active:bg-transparent"
            >
              문서
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-16 pt-4 md:pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <FileUploader onUpload={handleUpload} checkDuplicates={checkDuplicates} />
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <GithubInput onIndex={handleGithubIndex} checkDuplicateRepo={checkDuplicateRepo} />
            </div>
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
              <SlackSettings />
            </div>
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
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
