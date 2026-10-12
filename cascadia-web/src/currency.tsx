// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useCallback, useSyncExternalStore } from 'react'

/**
 * Preferred display currency (ISO 4217, 3 uppercase letters).
 * Stored in localStorage; falls back to USD when absent or invalid.
 */
export const CURRENCY_STORAGE_KEY = 'cascadia-currency'
export const DEFAULT_CURRENCY = 'USD'

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'JPY', label: 'JPY' },
  { value: 'RUB', label: 'RUB' },
  { value: 'CNY', label: 'CNY' },
  { value: 'KZT', label: 'KZT' },
] as const

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]['value']

export function isValidCurrencyCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value)
}

export function readStoredCurrency(): string {
  try {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY)
    if (stored && isValidCurrencyCode(stored)) return stored
  } catch {
    /* storage unavailable — fall through to default */
  }
  return DEFAULT_CURRENCY
}

type CurrencyListener = () => void

const listeners = new Set<CurrencyListener>()

function notifyCurrencyListeners() {
  for (const listener of listeners) listener()
}

function subscribeCurrency(listener: CurrencyListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getCurrencySnapshot(): string {
  return readStoredCurrency()
}

// Server snapshot never changes (SSR renders the default).
function getCurrencyServerSnapshot(): string {
  return DEFAULT_CURRENCY
}

// Fired by setCurrency below so every mounted hook re-reads in this tab.
// Cross-tab updates arrive via the native 'storage' event wired in the hook.
const CURRENCY_EVENT = 'cascadia:currency-change'

export function writeStoredCurrency(code: string): boolean {
  const normalized = code.trim().toUpperCase()
  if (!isValidCurrencyCode(normalized)) return false
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, normalized)
  } catch {
    /* storage unavailable — still apply for this session */
  }
  try {
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: normalized }))
  } catch {
    /* non-DOM environment (tests) — subscribers read on next render */
  }
  notifyCurrencyListeners()
  return true
}

/**
 * Shared preferred-currency state. Unlike a bare useState initialized from
 * localStorage, every mounted instance re-renders when any instance (or
 * another tab) changes the currency — so the header switcher, part cards,
 * tables and reports stay in sync.
 */
export function usePreferredCurrency() {
  const currency = useSyncExternalStore(
    subscribeCurrency,
    getCurrencySnapshot,
    getCurrencyServerSnapshot,
  )

  const setCurrency = useCallback((code: string) => {
    return writeStoredCurrency(code)
  }, [])

  return { currency, setCurrency }
}

// Re-emit cross-tab storage changes to in-memory subscribers.
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (event) => {
    if (event.key === CURRENCY_STORAGE_KEY) notifyCurrencyListeners()
  })
  window.addEventListener(CURRENCY_EVENT, () => notifyCurrencyListeners())
}
