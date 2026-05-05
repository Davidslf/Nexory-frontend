import { useState, useEffect } from 'react';
import { apiGetTasks } from '@/services/api';

export const useTaskCount = (): number => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    apiGetTasks({ completed: 'false' })
      .then((res: any) => setPendingCount(res?.meta?.pending ?? 0))
      .catch(() => setPendingCount(0));
  }, []);

  return pendingCount;
};
