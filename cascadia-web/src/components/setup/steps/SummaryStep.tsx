// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSetupStrings } from '../strings'
import type { WizardStep } from '../strings'
import type { SetupProgressState } from '../hooks/useSetupStatus'
import { Button, Card, CardContent } from '@/components/ui'

interface SummaryStepProps {
  progress: SetupProgressState
  onFinish: () => void
  finishing: boolean
}

export function SummaryStep({
  progress,
  onFinish,
  finishing,
}: SummaryStepProps) {
  const strings = useSetupStrings()
  const { t } = useTranslation('setup')
  const ITEMS: Array<{ key: keyof SetupProgressState; step: WizardStep }> = [
    { key: 'orgInfo', step: 'org' },
    { key: 'users', step: 'users' },
    { key: 'ai', step: 'ai' },
    { key: 'programs', step: 'programs' },
    { key: 'tools', step: 'tools' },
  ]
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {strings.steps.summary.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {strings.steps.summary.description}
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {ITEMS.map((item) => {
              const done = progress[item.key] === true
              return (
                <li key={item.key} className="flex items-center gap-3">
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-sm text-slate-900 dark:text-slate-100">
                    {strings.steps[item.step].label}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto">
                    {done ? t('summary.done') : t('summary.skipped')}
                  </span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <div>
        <Button onClick={onFinish} disabled={finishing}>
          {finishing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          {finishing ? strings.actions.saving : strings.actions.finish}
        </Button>
      </div>
    </div>
  )
}
