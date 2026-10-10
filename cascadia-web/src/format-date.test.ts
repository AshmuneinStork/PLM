// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC


import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime } from './format-date'

describe('formatDate', () => {
  it('formats ISO date with explicit locale', () => {
    expect(formatDate('2026-03-15T12:00:00Z', 'en')).toContain('2026')
    expect(formatDate('2026-03-15T12:00:00Z', 'ru')).toContain('2026')
  })

  it('differs between en and ru month names', () => {
    const en = formatDate('2026-03-15T12:00:00Z', 'en')
    const ru = formatDate('2026-03-15T12:00:00Z', 'ru')
    expect(en).not.toBe(ru)
  })

  it('falls back to raw string on invalid input', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
    expect(formatDate(null)).toBe('')
  })
})

describe('formatDateTime', () => {
  it('includes time parts', () => {
    const out = formatDateTime('2026-03-15T12:30:00Z', 'en')
    expect(out).toContain('2026')
    expect(out).toMatch(/\d{1,2}:\d{2}/)
  })

  it('falls back to raw string on invalid input', () => {
    expect(formatDateTime('nope')).toBe('nope')
  })
})
