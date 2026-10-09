// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useTranslation } from 'react-i18next'
import type { Part } from '@cascadia/commons/items/types/part'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ViewEditBadge,
  ViewEditCurrency,
  ViewEditNumber,
  ViewEditText,
} from '@/components/ui'

// Shared with the design page's in-place part form, so both offer the one
// list of types.
/** @deprecated Labels are EN-only; prefer `parts.typeLabels.*` via useTranslation. */
export const PART_TYPE_OPTIONS = [
  { value: 'Manufacture', label: 'Manufacture' },
  { value: 'Purchase', label: 'Purchase' },
  { value: 'Software', label: 'Software' },
  { value: 'Phantom', label: 'Phantom' },
]

const WEIGHT_UNIT_OPTIONS = [
  { value: 'kg', label: 'kg' },
  { value: 'g', label: 'g' },
  { value: 'lb', label: 'lb' },
  { value: 'oz', label: 'oz' },
]

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'JPY', label: 'JPY' },
]

/**
 * Production and sourcing fields: type, tracking policy, material, weight,
 * cost, lead time.
 *
 * Takes both parts because the page shows the *displayed* version's values
 * while reading, and the *edited* draft while editing — the same pair every
 * field card on this page threads. The option lists live here rather than in
 * PartDetail because nothing else uses them.
 */
export function PartManufacturingCard({
  edited,
  displayed,
  isEditing,
  onFieldChange,
}: {
  edited: Part
  displayed: Part
  isEditing: boolean
  onFieldChange: (field: keyof Part, value: unknown) => void
}) {
  const { t } = useTranslation('entities')
  const updateField = onFieldChange
  const typeOptions = [
    { value: 'Manufacture', label: t('parts.typeLabels.manufacture') },
    { value: 'Purchase', label: t('parts.typeLabels.purchase') },
    { value: 'Software', label: t('parts.typeLabels.software') },
    { value: 'Phantom', label: t('parts.typeLabels.phantom') },
  ]
  const trackingOptions = [
    { value: 'none', label: t('parts.detail.manufacturing.notTracked') },
    { value: 'lot', label: t('parts.detail.manufacturing.lotTracked') },
    { value: 'serial', label: t('parts.detail.manufacturing.serialTracked') },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('parts.detail.manufacturing.title')}</CardTitle>
        <CardDescription>{t('parts.detail.manufacturing.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ViewEditBadge
            label={t('parts.detail.manufacturing.type')}
            value={isEditing ? edited.partType : displayed.partType}
            onChange={(v) => updateField('partType', v)}
            isEditing={isEditing}
            options={typeOptions}
            variant={(v) => {
              const m: Record<
                string,
                'default' | 'secondary' | 'success' | 'outline'
              > = {
                Manufacture: 'default',
                Purchase: 'secondary',
                Software: 'success',
                Phantom: 'outline',
              }
              return m[v] || 'default'
            }}
          />
          <ViewEditBadge
            label={t('parts.detail.manufacturing.tracking')}
            value={
              isEditing
                ? (edited.trackingMode ?? 'none')
                : (displayed.trackingMode ?? 'none')
            }
            onChange={(v) => updateField('trackingMode', v)}
            isEditing={isEditing}
            options={trackingOptions}
            variant={(v) => {
              const m: Record<
                string,
                'default' | 'secondary' | 'success' | 'outline'
              > = {
                none: 'outline',
                lot: 'secondary',
                serial: 'success',
              }
              return m[v] || 'outline'
            }}
          />
          <ViewEditText
            label={t('parts.detail.manufacturing.material')}
            value={isEditing ? edited.material : displayed.material}
            onChange={(v) => updateField('material', v)}
            isEditing={isEditing}
            placeholder={t('parts.detail.manufacturing.materialPlaceholder')}
          />
          <ViewEditNumber
            label={t('parts.detail.manufacturing.weight')}
            value={isEditing ? edited.weight : displayed.weight}
            onChange={(v) => updateField('weight', v)}
            isEditing={isEditing}
            unitOptions={WEIGHT_UNIT_OPTIONS}
            unitValue={isEditing ? edited.weightUnit : displayed.weightUnit}
            onUnitChange={(v) => updateField('weightUnit', v)}
            step="0.001"
          />
          <ViewEditCurrency
            label={t('parts.detail.manufacturing.cost')}
            value={isEditing ? edited.cost : displayed.cost}
            onChange={(v) => updateField('cost', v)}
            isEditing={isEditing}
            currency={isEditing ? edited.costCurrency : displayed.costCurrency}
            currencyOptions={CURRENCY_OPTIONS}
            onCurrencyChange={(v) => updateField('costCurrency', v)}
          />
          <ViewEditNumber
            label={t('parts.detail.manufacturing.leadTime')}
            value={isEditing ? edited.leadTimeDays : displayed.leadTimeDays}
            onChange={(v) =>
              updateField('leadTimeDays', v ? parseInt(v) : undefined)
            }
            isEditing={isEditing}
            unit={t('parts.detail.manufacturing.leadTimeUnit')}
            min={0}
          />
        </dl>
      </CardContent>
    </Card>
  )
}
