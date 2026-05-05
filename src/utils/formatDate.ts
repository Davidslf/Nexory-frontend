import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return format(date, "d MMM yyyy", { locale: es });
};

export const getPaymentStatus = (dueDate: string) => {
  const today = new Date();
  const due = new Date(dueDate);
  const daysDiff = differenceInDays(due, today);

  if (daysDiff > 5) {
    return {
      status: 'paid' as const,
      label: 'Al día',
      days: daysDiff,
    };
  } else if (daysDiff >= 0 && daysDiff <= 5) {
    return {
      status: 'warning' as const,
      label: 'Vence pronto',
      days: daysDiff,
    };
  } else {
    return {
      status: 'overdue' as const,
      label: 'Vencido',
      days: Math.abs(daysDiff),
    };
  }
};
