import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  className?: string;
}

export const Pagination = ({ page, pageSize, total, onChange, className }: PaginationProps) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  const btn = (p: number | '…', i: number) => {
    if (p === '…') return (
      <span key={`ellipsis-${i}`} className="px-1 text-text-subtle text-xs select-none">…</span>
    );
    const isActive = p === page;
    return (
      <button
        key={p}
        onClick={() => onChange(p)}
        className={cn(
          'w-7 h-7 rounded-md text-xs font-medium transition-colors',
          isActive
            ? 'bg-primary text-white'
            : 'text-text-muted hover:bg-surface-raised hover:text-text-main',
        )}
      >
        {p}
      </button>
    );
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <p className="text-[11px] text-text-muted font-mono">
        {from}–{to} de {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:bg-surface-raised hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        {pages.map((p, i) => btn(p, i))}
        <button
          onClick={() => onChange(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:bg-surface-raised hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
