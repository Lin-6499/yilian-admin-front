const MYSQL_DATETIME_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/

function pad(value) {
  return String(value).padStart(2, '0')
}

function formatMysqlDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function normalizeMysqlDateTime(value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : formatMysqlDateTime(value)
  }

  const text = String(value).trim()
  if (!text) {
    return ''
  }

  if (MYSQL_DATETIME_PATTERN.test(text)) {
    return text
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return formatMysqlDateTime(parsed)
  }

  return text
}