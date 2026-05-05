import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface Filter {
  key: string;
  label: string;
  value: string;
}

interface FilterPillsProps {
  filters: Filter[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
}

export const FilterPills = ({ filters, onRemove, onClearAll }: FilterPillsProps) => {
  if (filters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-wrap items-center gap-2"
    >
      {filters.map((filter) => (
        <motion.div
          key={filter.key}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-full text-sm font-medium"
        >
          <span>{filter.label}:</span>
          <span className="font-semibold">{filter.value}</span>
          <button
            onClick={() => onRemove(filter.key)}
            className="ml-1 hover:bg-gray-100 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </motion.div>
      ))}
      {onClearAll && (
        <button
          onClick={onClearAll}
          className="text-sm text-text-muted hover:text-text-main font-medium transition-colors"
        >
          Limpiar todo
        </button>
      )}
    </motion.div>
  );
};
