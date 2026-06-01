'use client';

import { UploadedDocument, UploadStatus } from '@/types';

interface FileListProps {
  documents: UploadedDocument[];
  onRetry: (id: string) => void;
}

const STATUS_CONFIG: Record<UploadStatus, { label: string; className: string }> = {
  uploading: {
    label: '업로드 중',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  indexing: {
    label: '인덱싱 중',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  },
  ready: {
    label: '준비 완료',
    className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  error: {
    label: '오류',
    className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileList({ documents, onRetry }: FileListProps) {
  if (documents.length === 0) return null;

  return (
    <ul className="flex flex-col gap-2">
      {documents.map((doc) => {
        const { label, className } = STATUS_CONFIG[doc.status];
        return (
          <li
            key={doc.id}
            className="flex flex-col gap-1 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-zinc-700 dark:text-zinc-300">{doc.name}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-zinc-400">{formatSize(doc.size)}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
                  {label}
                </span>
              </div>
            </div>
            {doc.status === 'error' && (
              <div className="flex items-center gap-2">
                {doc.errorMessage && <p className="text-xs text-red-500">{doc.errorMessage}</p>}
                <button
                  onClick={() => onRetry(doc.id)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  재시도
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
