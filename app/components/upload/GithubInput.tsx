'use client';

import { useState } from 'react';
import { Link } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

interface GithubInputProps {
  onIndex: (url: string) => Promise<void>;
  checkDuplicateRepo: (url: string) => boolean;
}

export default function GithubInput({ onIndex, checkDuplicateRepo }: GithubInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingUrl, setPendingUrl] = useState('');

  const validate = (value: string) => {
    if (!value.trim()) return '레포 URL을 입력해주세요.';
    if (!GITHUB_URL_PATTERN.test(value.trim()))
      return 'https://github.com/owner/repo 형식으로 입력해주세요.';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    const validationError = validate(trimmed);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (checkDuplicateRepo(trimmed)) {
      setPendingUrl(trimmed);
      return;
    }

    await submit(trimmed);
  };

  const submit = async (targetUrl: string) => {
    setError('');
    setIsLoading(true);
    try {
      await onIndex(targetUrl);
      setUrl('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    const target = pendingUrl;
    setPendingUrl('');
    await submit(target);
  };

  const handleCancel = () => setPendingUrl('');

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">GitHub 레포 인덱싱</p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Link className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError('');
            }}
            placeholder="https://github.com/owner/repo"
            className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-600"
          />
        </div>
        <Button type="submit" size="sm" disabled={isLoading} className="h-8 shrink-0 text-xs">
          {isLoading ? '인덱싱 중...' : '인덱싱'}
        </Button>
      </form>
      {error && <p className="text-xs text-red-500">{error}</p>}

      <Dialog open={!!pendingUrl} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미 인덱싱된 레포예요</DialogTitle>
            <DialogDescription>
              <span className="font-medium">{pendingUrl}</span>이(가) 이미 문서 목록에 있어요. 다시
              인덱싱할까요?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              취소
            </Button>
            <Button onClick={handleConfirm}>다시 인덱싱</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
