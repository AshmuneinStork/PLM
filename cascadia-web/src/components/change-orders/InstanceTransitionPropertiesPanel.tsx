// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useTranslation } from 'react-i18next'
import { Trash2, X } from 'lucide-react'
import type { InstanceTransition } from '@cascadia/commons/lifecycles/types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from '@/components/ui'

interface InstanceTransitionPropertiesPanelProps {
  transition: InstanceTransition
  onUpdate: (transition: InstanceTransition) => void
  onDelete: (transitionId: string) => void
  onClose: () => void
  readOnly?: boolean
}

export function InstanceTransitionPropertiesPanel({
  transition,
  onUpdate,
  onDelete,
  onClose,
  readOnly = false,
}: InstanceTransitionPropertiesPanelProps) {
  const { t } = useTranslation('entities')
  const handleChange = (updates: Partial<InstanceTransition>) => {
    onUpdate({ ...transition, ...updates })
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{t('change-orders.panels.transitionProps.title')}</CardTitle>
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
        {/* Transition Name */}
        <div className="space-y-1.5">
          <Label htmlFor="transitionName" className="text-xs">
            {t('change-orders.panels.transitionProps.name')}
          </Label>
          <Input
            id="transitionName"
            value={transition.name}
            onChange={(e) => handleChange({ name: e.target.value })}
            className="h-8 text-sm"
            placeholder={t('change-orders.panels.transitionProps.namePlaceholder')}
            disabled={readOnly}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="transitionDescription" className="text-xs">
            {t('change-orders.panels.transitionProps.description')}
          </Label>
          <textarea
            id="transitionDescription"
            value={transition.description || ''}
            onChange={(e) => handleChange({ description: e.target.value })}
            className="w-full h-16 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none disabled:opacity-50"
            placeholder={t('change-orders.panels.transitionProps.descriptionPlaceholder')}
            disabled={readOnly}
          />
        </div>

        {/* Minimum approvals (WI-4.2) - enforced by the server */}
        <div className="space-y-1.5">
          <Label htmlFor="requiredApprovals" className="text-xs">
            {t('change-orders.panels.transitionProps.minApprovals')}
          </Label>
          <Input
            id="requiredApprovals"
            type="number"
            min={0}
            value={transition.approvalRequirement?.requiredCount ?? 0}
            onChange={(e) => {
              const count = Math.max(
                0,
                Number.parseInt(e.target.value, 10) || 0,
              )
              handleChange({
                approvalRequirement:
                  count > 0 ? { requiredCount: count } : undefined,
              })
            }}
            className="h-8 text-sm"
            disabled={readOnly}
          />
          <p className="text-xs text-slate-500">
            {t('change-orders.panels.transitionProps.minApprovalsHintPart1')}
            {t('change-orders.panels.transitionProps.minApprovalsHintPart2')}
            {t('change-orders.panels.transitionProps.minApprovalsHintPart3')}
          </p>
        </div>

        {/* Info about instance-level limitations */}
        <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-md">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('change-orders.panels.transitionProps.adhocNotePart1')}
            {t('change-orders.panels.transitionProps.adhocNotePart2')}
            {t('change-orders.panels.transitionProps.adhocNotePart3')}
          </p>
        </div>

        {/* Delete button */}
        {!readOnly && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDelete(transition.id)}
            className="w-full"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t('change-orders.panels.transitionProps.deleteTransition')}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
