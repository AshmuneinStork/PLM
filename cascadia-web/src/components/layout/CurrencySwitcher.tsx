// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, CircleDollarSign } from 'lucide-react'
import type { LanguageSwitcherProps } from './types'
import { CURRENCY_OPTIONS, isValidCurrencyCode, usePreferredCurrency } from '@/currency'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Input } from '@/components/ui'
import { cn } from '@/utils'

export function CurrencySwitcher({ className }: LanguageSwitcherProps) {
  const { t } = useTranslation('common')
  const { currency, setCurrency } = usePreferredCurrency()
  const [open, setOpen] = useState(false)
  const [customCode, setCustomCode] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)

  const pick = (code: string) => {
    if (setCurrency(code)) setOpen(false)
  }

  const applyCustom = () => {
    const normalized = customCode.trim().toUpperCase()
    if (!isValidCurrencyCode(normalized)) {
      setCustomError(t('currency.customInvalid'))
      return
    }
    setCustomError(null)
    if (setCurrency(normalized)) {
      setCustomCode('')
      setOpen(false)
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
            className,
          )}
          aria-label={t('currency.label')}
          title={t('currency.label')}
          data-testid="currency-switcher"
        >
          <CircleDollarSign
            size={18}
            className="text-gray-600 dark:text-gray-300"
          />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {currency}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {CURRENCY_OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => pick(opt.value)}
            className="cursor-pointer"
            data-testid={`currency-option-${opt.value}`}
          >
            <span className="flex-1">{opt.label}</span>
            {currency === opt.value && <Check size={16} />}
          </DropdownMenuItem>
        ))}
        <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {t('currency.customLabel')}
          </p>
          <div className="flex gap-1">
            <Input
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyCustom()
              }}
              placeholder={t('currency.customPlaceholder')}
              aria-label={t('currency.customLabel')}
              maxLength={3}
              className="h-8 uppercase"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          {customError && (
            <p className="mt-1 text-xs text-red-600">{customError}</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
