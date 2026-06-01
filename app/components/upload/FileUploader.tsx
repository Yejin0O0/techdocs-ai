'use client';

import { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud } from 'lucide-react';

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'text/markdown': ['.md'],
  'text/plain': ['.txt'],
};

const MAX_SIZE = 10 * 1024 * 1024;

interface FileUploaderProps {
  onUpload: (files: File[]) => void;
}

export default function FileUploader({ onUpload }: FileUploaderProps) {
  const [emptyFileError, setEmptyFileError] = useState('');
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const emptyFiles = acceptedFiles.filter((f) => f.size === 0);
      const validFiles = acceptedFiles.filter((f) => f.size > 0);

      if (emptyFiles.length > 0) {
        if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
        setEmptyFileError(
          `빈 파일은 업로드할 수 없어요: ${emptyFiles.map((f) => f.name).join(', ')}`
        );
        errorTimerRef.current = setTimeout(() => setEmptyFileError(''), 4000);
      }

      if (validFiles.length > 0) {
        onUpload(validFiles);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_SIZE,
    multiple: true,
  });

  return (
    <div className="flex flex-col gap-3">
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
            : 'border-zinc-300 bg-zinc-50 hover:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="h-8 w-8 text-zinc-400" />
        <p className="whitespace-pre-line break-keep text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {isDragActive ? '여기에 놓으세요' : '파일을 드래그하거나\n클릭해서 업로드'}
        </p>
        <p className="text-center text-xs text-zinc-400">.pdf, .md, .txt / 최대 10MB</p>
      </div>

      {fileRejections.length > 0 && (
        <p className="text-sm text-red-500">
          지원하지 않는 파일 형식이거나 크기가 초과됐어요. (.pdf, .md, .txt / 최대 10MB)
        </p>
      )}
      {emptyFileError && <p className="text-sm text-red-500">{emptyFileError}</p>}
    </div>
  );
}
