import { format, formatDistanceToNow, isToday, isTomorrow, isPast, parseISO } from 'date-fns'

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return format(d, fmt)
  } catch {
    return '—'
  }
}

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a')

export const formatRelative = (date) => {
  if (!date) return '—'
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return '—'
  }
}

export const isFollowUpToday = (date) => {
  if (!date) return false
  try {
    return isToday(typeof date === 'string' ? parseISO(date) : date)
  } catch { return false }
}

export const isFollowUpOverdue = (date) => {
  if (!date) return false
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return isPast(d) && !isToday(d)
  } catch { return false }
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const formatPhone = (phone) => {
  if (!phone) return '—'
  const cleaned = phone.toString().replace(/\D/g, '')
  if (cleaned.length === 10) return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`
  return phone
}

// Format date into local "YYYY-MM-DDTHH:mm" for <input type="datetime-local" />
export const toLocalDatetimeInput = (dateInput) => {
  if (!dateInput) return ''
  const d = new Date(dateInput)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Convert local datetime-local value to ISO string with UTC indicator
export const toUtcIsoString = (localDatetimeStr) => {
  if (!localDatetimeStr) return null
  const d = new Date(localDatetimeStr)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

export const sanitizeFilename = (name) =>
  String(name || 'export')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')

export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

export const cn = (...classes) => classes.filter(Boolean).join(' ')
