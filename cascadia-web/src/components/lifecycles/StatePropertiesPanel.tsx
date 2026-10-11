// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { StateApproversPanel } from './StateApproversPanel'
import type { LifecycleState } from '@cascadia/commons/lifecycles/types'
import type { LifecyclePhaseConfig } from '@cascadia/commons/types/lifecycle'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'

interface StatePropertiesPanelProps {
  state: LifecycleState
  onUpdate: (state: LifecycleState) => void
  onClose: () => void
  /** Workflow definition ID - required for managing approvers */
  workflowDefinitionId?: string
  /** Available lifecycle phases to assign to this state */
  phases?: Array<LifecyclePhaseConfig>
}

const colorOptions = [
  { value: 'gray', labelKey: 'lifecycles.colors.gray', class: 'bg-slate-400' },
  { value: 'blue', labelKey: 'lifecycles.colors.blue', class: 'bg-blue-400' },
  { value: 'green', labelKey: 'lifecycles.colors.green', class: 'bg-green-400' },
  { value: 'yellow', labelKey: 'lifecycles.colors.yellow', class: 'bg-yellow-400' },
  { value: 'orange', labelKey: 'lifecycles.colors.orange', class: 'bg-orange-400' },
  { value: 'red', labelKey: 'lifecycles.colors.red', class: 'bg-red-400' },
  { value: 'purple', labelKey: 'lifecycles.colors.purple', class: 'bg-purple-400' },
  { value: 'cyan', labelKey: 'lifecycles.colors.cyan', class: 'bg-cyan-400' },
]

export function StatePropertiesPanel({
  state,
  onUpdate,
  onClose,
  workflowDefinitionId,
  phases,
}: StatePropertiesPanelProps) {
  const { t } = useTranslation('entities')
  // Helper to update state and immediately propagate changes
  const handleChange = (updates: Partial<LifecycleState>) => {
    onUpdate({ ...state, ...updates })
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t('lifecycles.statePanel.title')}
          </CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* State ID (readonly) */}
        <div className="space-y-1.5">
          <Label htmlFor="stateId" className="text-xs">
            {t('lifecycles.statePanel.stateId')}
          </Label>
          <Input
            id="stateId"
            value={state.id}
            disabled
            className="h-8 text-sm bg-slate-50 dark:bg-slate-900"
          />
        </div>

        {/* State Name */}
        <div className="space-y-1.5">
          <Label htmlFor="stateName" className="text-xs">
            {t('lifecycles.statePanel.name')}
          </Label>
          <Input
            id="stateName"
            value={state.name}
            onChange={(e) => handleChange({ name: e.target.value })}
            className="h-8 text-sm"
            placeholder={t('lifecycles.statePanel.namePlaceholder')}
          />
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <Label className="text-xs">
            {t('lifecycles.statePanel.color')}
          </Label>
          <Select
            value={state.color || 'gray'}
            onValueChange={(value) => handleChange({ color: value })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color.class}`} />
                    {t(color.labelKey)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phase */}
        {phases && phases.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs">
              {t('lifecycles.statePanel.phase')}
            </Label>
            <Select
              value={state.phaseId || '__unassigned__'}
              onValueChange={(value) =>
                handleChange({
                  phaseId: value === '__unassigned__' ? undefined : value,
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__unassigned__">{t('lifecycles.statePanel.noPhase')}</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.id} value={phase.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full bg-${phase.color || 'slate'}-400`}
                      />
                      {phase.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="stateDescription" className="text-xs">
            {t('lifecycles.statePanel.description')}
          </Label>
          <textarea
            id="stateDescription"
            value={state.description || ''}
            onChange={(e) => handleChange({ description: e.target.value })}
            className="w-full h-20 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
            placeholder={t('lifecycles.statePanel.descriptionPlaceholder')}
          />
        </div>

        {/* State Type Flags */}
        <div className="space-y-2">
          <Label className="text-xs">{t('lifecycles.statePanel.flags')}</Label>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.isInitial || false}
                onChange={(e) =>
                  handleChange({
                    isInitial: e.target.checked,
                    // Can't be both initial and final
                    isFinal: e.target.checked ? false : state.isFinal,
                  })
                }
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t('lifecycles.statePanel.initialState')}
              </span>
              <span className="text-xs text-slate-500">
                {t('lifecycles.statePanel.initialHint')}
              </span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={state.isFinal || false}
                onChange={(e) =>
                  handleChange({
                    isFinal: e.target.checked,
                    // Can't be both initial and final
                    isInitial: e.target.checked ? false : state.isInitial,
                    finalKind: e.target.checked ? state.finalKind : undefined,
                  })
                }
                className="rounded border-slate-300 dark:border-slate-600"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {t('lifecycles.statePanel.finalState')}
              </span>
              <span className="text-xs text-slate-500">
                {t('lifecycles.statePanel.finalHint')}
              </span>
            </label>
          </div>
        </div>

        {/* What completing the workflow in this state means. Change-order
            workflows fail closed without it — never inferred from the name. */}
        {state.isFinal && (
          <div className="space-y-1.5">
            <Label className="text-xs">{t('lifecycles.statePanel.onCompletion')}</Label>
            <Select
              value={state.finalKind ?? ''}
              onValueChange={(value) =>
                handleChange({
                  finalKind: value as LifecycleState['finalKind'],
                })
              }
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={t('lifecycles.statePanel.onCompletionPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="release">
                  {t('lifecycles.statePanel.releaseOption')}
                </SelectItem>
                <SelectItem value="cancel">
                  {t('lifecycles.statePanel.cancelOption')}
                </SelectItem>
              </SelectContent>
            </Select>
            {!state.finalKind && (
              <p className="text-xs text-amber-600 dark:text-amber-500">
                Required for change-order workflows: choose what completing the
                workflow here does.
              </p>
            )}
          </div>
        )}

        {/* Approvers Section - only shown when editing an existing workflow */}
        {workflowDefinitionId && (
          <div className="border-t pt-4">
            <StateApproversPanel
              workflowDefinitionId={workflowDefinitionId}
              stateId={state.id}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
