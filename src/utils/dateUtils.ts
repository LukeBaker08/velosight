
import { format } from 'date-fns';

export const formatDate = (date: string | Date, formatString: string = 'dd/MM/yy'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatString);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'dd/MM/yy, HH:mm');
};
