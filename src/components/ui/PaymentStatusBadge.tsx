import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  dueDate: string;
}

export const PaymentStatusBadge = ({ dueDate }: PaymentStatusBadgeProps) => {
  const today    = new Date();
  const due      = new Date(dueDate);
  const daysDiff = differenceInDays(due, today);

  const status = (() => {
    if (daysDiff > 5)  return { label: 'Al día',      cls: 'badge-active',    Icon: CheckCircle2 };
    if (daysDiff >= 0) return { label: 'Vence pronto', cls: 'badge-pending',   Icon: AlertCircle  };
    return               { label: 'Vencido',          cls: 'badge-suspended', Icon: XCircle      };
  })();

  const { label, cls, Icon } = status;

  return (
    <div className="flex flex-col gap-0.5">
      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${cls}`}>
        <Icon className="w-3 h-3" />
        {label}
      </span>
      <span className="text-[10px] text-text-muted data-mono pl-0.5">
        {format(due, 'd MMM yyyy', { locale: es })}
      </span>
    </div>
  );
};
