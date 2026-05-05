import { Search, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput = ({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: SearchInputProps) => {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-10 py-2.5 rounded-md text-sm transition-all',
          'bg-surface border border-border',
          'text-text-main placeholder:text-text-muted',
          'focus:outline-none focus:border-primary/35 focus:bg-surface-raised'
        )}
      />
      {value && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-text-muted hover:text-text-main transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </div>
  );
};
