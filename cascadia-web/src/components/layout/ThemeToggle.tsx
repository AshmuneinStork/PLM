// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { ThemeToggleProps } from './types'
import { useTheme } from '@/theme'
import { cn } from '@/utils'

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()
  const { t } = useTranslation('common')

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors',
        className,
      )}
      aria-label={t('theme.toggle')}
      title={t('theme.switchTo', {
        mode: t(`theme.${theme === 'light' ? 'dark' : 'light'}`),
      })}
    >
      {theme === 'light' ? (
        <Moon size={18} className="text-gray-600 dark:text-gray-300" />
      ) : (
        <Sun size={18} className="text-yellow-500 dark:text-yellow-400" />
      )}
    </button>
  )
}
