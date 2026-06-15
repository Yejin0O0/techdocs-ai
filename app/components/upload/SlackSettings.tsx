'use client';

import { Hash } from 'lucide-react';

export default function SlackSettings() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Slack 연동</p>
      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-2 flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
          <Hash className="h-3.5 w-3.5" />
          사용 방법
        </div>
        <ol className="space-y-1 text-zinc-500 dark:text-zinc-400">
          <li>1. 원하는 채널에 TechDocs AI 봇을 초대하세요</li>
          <li>
            2. 채널에서{' '}
            <code className="rounded bg-zinc-200 px-1 py-0.5 dark:bg-zinc-700">
              @TechDocs AI [질문]
            </code>{' '}
            형식으로 멘션하세요
          </li>
          <li>3. 인덱싱된 문서를 기반으로 스레드에 답변이 달려요</li>
        </ol>
      </div>
    </div>
  );
}
