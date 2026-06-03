'use client';

import { Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UploadedDocument, UploadStatus } from '@/types';

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

export default function FileList({ documents, onRetry, onDelete }: FileListProps) {
  if (documents.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => {
        const { label, className: badgeClassName } = STATUS_CONFIG[doc.status];
        return (
          <li
            key={doc.id}
            className="group flex flex-col gap-2 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between gap-2">
              <Tooltip>
                <TooltipTrigger className="truncate text-sm text-zinc-700 dark:text-zinc-300">
                  {doc.name}
                </TooltipTrigger>
                <TooltipContent>{doc.name}</TooltipContent>
              </Tooltip>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-zinc-400">{formatSize(doc.size)}</span>
                <Badge className={badgeClassName}>{label}</Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(doc.id)}
                  className="invisible h-6 w-6 cursor-pointer text-zinc-400 hover:text-red-500 group-hover:visible"
                  aria-label="삭제"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            {doc.status === 'uploading' && doc.progress !== undefined && (
              <div className="flex items-center gap-2">
                <Progress
                  value={doc.progress}
                  className="flex-1"
                  indicatorClassName="bg-blue-500"
                />
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
      })}
    </ul>
  );
}
