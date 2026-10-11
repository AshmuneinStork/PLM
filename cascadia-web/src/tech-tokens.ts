// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

/**
 * Engineering tech tokens that must NOT be translated.
 *
 * `qty:`, `find#:` and `ref:` are compact drawing/BOM annotations shared
 * across locales (as in `qty: 2, find#: 1, ref: R3`). They stay identical
 * in EN and RU so shop-floor documents, CSV exports and history entries
 * remain unambiguous. Table column headers (`Qty`, `Find #`, `Ref Des`)
 * are regular UI labels and live in i18n dictionaries instead.
 */

export const TECH_TOKEN_QTY = 'qty' as const
export const TECH_TOKEN_FIND_NUMBER = 'find#' as const
export const TECH_TOKEN_REF_DESIGNATOR = 'ref' as const

/**
 * Format a `token: value` pair with a do-not-translate token prefix.
 */
export function formatTechToken(token: string, value: unknown): string {
  return `${token}: ${String(value)}`
}
