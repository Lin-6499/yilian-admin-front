import test from 'node:test'
import assert from 'node:assert/strict'

import { normalizeMysqlDateTime } from '../src/utils/datetime.js'

test('normalizes ISO 8601 datetime strings to mysql format', () => {
  const localDate = new Date(2026, 2, 14, 15, 28, 9)
  const isoString = localDate.toISOString()

  assert.equal(normalizeMysqlDateTime(isoString), '2026-03-14 15:28:09')
})

test('keeps mysql datetime strings unchanged', () => {
  assert.equal(normalizeMysqlDateTime('2026-03-14 15:28:09'), '2026-03-14 15:28:09')
})