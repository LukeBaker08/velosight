import { format } from 'date-fns'

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null
  const d = typeof value === 'string' ? new Date(value) : value
  return isNaN(d.getTime()) ? null : d
}

export const formatDate = (
  date: string | Date | null | undefined,
  formatString: string = 'dd/MM/yy'
): string => {
  const d = toDate(date)
  return d ? format(d, formatString) : '—' // fallback placeholder
}

export const formatDateTime = (
  date: string | Date | null | undefined
): string => {
  return formatDate(date, 'dd/MM/yy, HH:mm')
}
