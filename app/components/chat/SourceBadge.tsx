'use client';

import { Badge } from '@/components/ui/badge';
import { ChatSource } from '@/types';

interface Props {
  source: ChatSource;
  onClick: () => void;
}

export default function SourceBadge({ source, onClick }: Props) {
  const label =
    source.page !== undefined ? `${source.fileName} · p.${source.page}` : source.fileName;

  return (
    <Badge
      variant="outline"
      render={<button />}
      onClick={(e: React.MouseEvent) => {
        e.stopPropagation();
        onClick();
      }}
      className="max-w-[200px] cursor-pointer gap-1 hover:bg-muted"
    >
      <span>📎</span>
      <span className="truncate">{label}</span>
    </Badge>
  );
}
