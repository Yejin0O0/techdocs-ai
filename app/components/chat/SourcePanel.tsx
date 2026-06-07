'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { FileText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChatSource } from '@/types';

const MIN_WIDTH = 280;
const MAX_RATIO = 0.75; // 화면 너비의 75%
const DEFAULT_RATIO = 0.3; // 화면 너비의 30%

interface Props {
  source: ChatSource;
  question: string;
  isOpen: boolean;
  onClose: () => void;
}

function highlightText(text: string, question: string): React.ReactNode[] {
  const words = question
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (!words.length) return [text];

  const pattern = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded bg-yellow-200 px-0.5 dark:bg-yellow-800">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SourcePanel({ source, question, isOpen, onClose }: Props) {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth * DEFAULT_RATIO : 384
  );
  const isDragging = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newWidth = window.innerWidth - e.clientX;
      const maxWidth = window.innerWidth * MAX_RATIO;
      setWidth(Math.min(maxWidth, Math.max(MIN_WIDTH, newWidth)));
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="flex flex-col gap-0 overflow-hidden p-0"
        style={{ width }}
      >
        {/* 리사이즈 핸들 */}
        <div
          onMouseDown={onMouseDown}
          className="absolute top-0 left-0 h-full w-1 cursor-col-resize hover:bg-zinc-300 dark:hover:bg-zinc-600"
        />

        <SheetHeader className="border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <FileText className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {source.fileName}
              </SheetTitle>
              {source.page !== undefined && (
                <Badge variant="secondary" className="mt-1 text-xs">
                  p.{source.page}
                </Badge>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="mb-2 text-xs font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
            원문
          </p>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
              {highlightText(source.chunk, question)}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
