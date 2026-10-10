// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC


import i18n from './i18n/config'

export type DateInput = string | number | Date | null | undefined

function currentLocale(): string {
  return i18n.resolvedLanguage || i18n.language || 'en'
}

function toDate(value: DateInput): Date | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

/**
 * Format a value as a localized date (no time part).
 * Falls back to the raw string when the value is not a valid date.
 */
export function formatDate(value: DateInput, locale?: string): string {
  const date = toDate(value)
  if (!date) return typeof value === 'string' ? value : ''
  return new Intl.DateTimeFormat(locale ?? currentLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

/**
 * Format a value as a localized date + time.
 * Falls back to the raw string when the value is not a valid date.
 */
export function formatDateTime(value: DateInput, locale?: string): string {
  const date = toDate(value)
  if (!date) return typeof value === 'string' ? value : ''
  return new Intl.DateTimeFormat(locale ?? currentLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
