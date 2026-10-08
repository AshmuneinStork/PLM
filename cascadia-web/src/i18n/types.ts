// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC


/**
 * Shared i18n types: namespaces and supported languages.
 */

export type I18nNamespace =
  | 'common'
  | 'auth'
  | 'dashboard'
  | 'layout'
  | 'setup'

export type Language = 'en' | 'ru'

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
}

export const LANGUAGE_SHORT_LABELS: Record<Language, string> = {
  en: 'EN',
  ru: 'RU',
}

/**
 * Format a date using the active UI locale.
 */
export function formatDateLocale(
  value: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleDateString(locale, options)
}

/**
 * Format a date+time using the active UI locale.
 */
export function formatDateTimeLocale(
  value: Date | string | number,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleString(locale, options)
}

/**
 * Format a number using the active UI locale.
 */
export function formatNumberLocale(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value)
}
