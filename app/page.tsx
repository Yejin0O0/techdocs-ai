'use client';

import FileUploader from '@/app/components/upload/FileUploader';
import FileList from '@/app/components/upload/FileList';
import { useDocuments } from '@/app/hooks/useDocuments';

export default function Home() {
  const { documents, handleUpload, handleRetry } = useDocuments();

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950">
      <aside className="flex w-72 shrink-0 flex-col gap-4 border-r border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">문서</h2>
        <FileUploader onUpload={handleUpload} />
        <div className="flex-1 overflow-y-auto">
          <FileList documents={documents} onRetry={handleRetry} />
        </div>
      </aside>
      <main className="flex flex-1 items-center justify-center">
        <p className="text-sm text-zinc-400">채팅 UI 준비 중</p>
      </main>
    </div>
  );
}
