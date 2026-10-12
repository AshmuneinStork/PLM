// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Part } from '@cascadia/commons/items/types/part'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  ViewEditBadge,
  ViewEditCurrency,
  ViewEditNumber,
  ViewEditText,
} from '@/components/ui'
import { CURRENCY_OPTIONS, isValidCurrencyCode } from '@/currency'

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

const CUSTOM_CURRENCY_VALUE = '__custom__'

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
  const [customCode, setCustomCode] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const currentCurrency = isEditing
    ? edited.costCurrency
    : displayed.costCurrency
  const knownCurrency = CURRENCY_OPTIONS.some((o) => o.value === currentCurrency)
  const currencySelectValue =
    currentCurrency && !knownCurrency ? CUSTOM_CURRENCY_VALUE : (currentCurrency ?? 'USD')
  const currencyOptions = [
    ...CURRENCY_OPTIONS,
    { value: CUSTOM_CURRENCY_VALUE, label: t('parts.detail.manufacturing.customCurrency') },
  ]

  const handleCurrencySelect = (v: string) => {
    setCustomError(null)
    if (v === CUSTOM_CURRENCY_VALUE) {
      // Keep showing the custom input; apply on blur/Enter below.
      setCustomCode((prev) => prev || currentCurrency || '')
      return
    }
    updateField('costCurrency', v)
  }

  const applyCustomCode = () => {
    const normalized = customCode.trim().toUpperCase()
    if (!isValidCurrencyCode(normalized)) {
      setCustomError(t('parts.detail.manufacturing.customCurrencyInvalid'))
      return
    }
    setCustomError(null)
    updateField('costCurrency', normalized)
  }
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
            currency={currencySelectValue === CUSTOM_CURRENCY_VALUE ? (currentCurrency ?? 'USD') : currencySelectValue}
            currencyOptions={currencyOptions}
            onCurrencyChange={handleCurrencySelect}
          />
          {isEditing && currencySelectValue === CUSTOM_CURRENCY_VALUE && (
            <div className="-mt-4">
              <Input
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                onBlur={applyCustomCode}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyCustomCode()
                }}
                placeholder={t('parts.detail.manufacturing.customCurrencyPlaceholder')}
                aria-label={t('parts.detail.manufacturing.customCurrency')}
                maxLength={3}
                className="w-24 uppercase"
              />
              {customError && (
                <p className="mt-1 text-xs text-red-600">{customError}</p>
              )}
            </div>
          )}
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
