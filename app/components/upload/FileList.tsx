'use client';

import { useEffect, useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UploadedDocument, UploadStatus } from '@/types';

function useElapsed(startedAt: Date) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return elapsed;
}

interface FileListProps {
  documents: UploadedDocument[];
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_CONFIG: Record<UploadStatus, { label: string; className: string }> = {
  uploading: {
    label: '업로드 중',
    className: 'bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-300',
  },
  indexing: {
    label: '인덱싱 중',
    className:
      'bg-yellow-100 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300',
  },
  ready: {
    label: '준비 완료',
    className:
      'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900 dark:text-green-300',
  },
  error: {
    label: '오류',
    className: 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900 dark:text-red-300',
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileItem({
  doc,
  onRetry,
  onDelete,
}: {
  doc: UploadedDocument;
  onRetry: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { label, className: badgeClassName } = STATUS_CONFIG[doc.status];
  const elapsed = useElapsed(
    doc.status === 'indexing' && doc.indexingStartedAt ? doc.indexingStartedAt : new Date(0)
  );
  const isIndexing = doc.status === 'indexing' && doc.indexingStartedAt;

  return (
    <li className="group flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-2">
        <Tooltip>
          <TooltipTrigger className="truncate text-sm text-zinc-700 dark:text-zinc-300">
            {doc.name}
          </TooltipTrigger>
          <TooltipContent>{doc.name}</TooltipContent>
        </Tooltip>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs text-zinc-400">{formatSize(doc.size)}</span>
          {isIndexing ? (
            <Badge className={badgeClassName}>인덱싱 중 · {elapsed}초</Badge>
          ) : (
            <Badge className={badgeClassName}>{label}</Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-zinc-400 outline-none">
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-fit min-w-fit">
              <DropdownMenuItem className="cursor-pointer" onClick={() => onDelete(doc.id)}>
                <span className="flex items-center gap-1.5 leading-none px-2">
                  <Trash2 className="size-4 shrink-0" />
                  <span>삭제</span>
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isIndexing && elapsed >= 30 && (
        <p className="text-xs text-yellow-600 dark:text-yellow-400">시간이 오래 걸리고 있어요...</p>
      )}

      {doc.status === 'uploading' && doc.progress !== undefined && (
        <div className="flex items-center gap-2">
          <Progress value={doc.progress} className="flex-1" indicatorClassName="bg-blue-500" />
          <span className="shrink-0 text-xs text-zinc-400">{doc.progress}%</span>
        </div>
      )}

      {doc.status === 'error' && (
        <div className="flex items-center gap-2">
          {doc.errorMessage && <p className="text-xs text-red-500">{doc.errorMessage}</p>}
          <Button
            variant="link"
            size="sm"
            className="h-auto cursor-pointer p-0 text-xs"
            onClick={() => onRetry(doc.id)}
          >
            재시도
          </Button>
        </div>
      )}
    </li>
  );
}

export default function FileList({ documents, onRetry, onDelete }: FileListProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">업로드된 문서가 없어요</p>
        <p className="text-xs text-zinc-300 dark:text-zinc-600">
          .pdf, .md, .txt 파일을 업로드해보세요
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => (
        <FileItem key={doc.id} doc={doc} onRetry={onRetry} onDelete={onDelete} />
      ))}
    </ul>
  );
}
