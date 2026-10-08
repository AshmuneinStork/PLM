// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC



import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Languages } from 'lucide-react'
import type { LanguageSwitcherProps } from './types'
import type { Language } from '@/i18n/types'
import { LANGUAGE_LABELS, LANGUAGE_SHORT_LABELS } from '@/i18n/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { cn } from '@/utils'
import { STORAGE_KEY } from '@/i18n/config'

const ORDER: Array<Language> = ['en', 'ru']

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation('common')
  const [open, setOpen] = useState(false)
  const current = (
    i18n.resolvedLanguage === 'ru' ? 'ru' : 'en'
  ) satisfies Language

  const switchTo = async (lng: Language) => {
    try {
      localStorage.setItem(STORAGE_KEY, lng)
    } catch {
      /* storage unavailable — the choice still applies for this session */
    }
    await i18n.changeLanguage(lng)
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex items-center gap-1 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
            className,
          )}
          aria-label={t('language.label')}
          title={t('language.label')}
          data-testid="language-switcher"
        >
          <Languages
            size={18}
            className="text-gray-600 dark:text-gray-300"
          />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            {LANGUAGE_SHORT_LABELS[current]}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {ORDER.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => void switchTo(lng)}
            className="cursor-pointer"
            data-testid={`language-option-${lng}`}
          >
            <span className="flex-1">{LANGUAGE_LABELS[lng]}</span>
            {current === lng && <Check size={16} />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
