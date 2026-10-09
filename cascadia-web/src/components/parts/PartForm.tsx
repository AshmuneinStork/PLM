// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useForm, useStore } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { partSchema } from '@cascadia/commons/items/types/part'
import type { Part } from '@cascadia/commons/items/types/part'
import type { Design } from '@cascadia/commons/types/design'
import { DesignSelector } from '@/components/versioning/DesignSelector'
import { DesignPhaseIndicator } from '@/components/versioning/DesignPhaseIndicator'
import { BranchSelector } from '@/components/versioning/BranchSelector'
import { AttributesEditor } from '@/components/items/AttributesEditor'
import { ItemNumberField } from '@/components/items/ItemNumberField'
import { designStatusQuery } from '@/query'
import { zodValidator } from '@/form-validation'
import {
  Button,
  FormField,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'

interface PartFormProps {
  part?: Partial<Part>
  /** List of designs to select from */
  designs?: Array<Design>
  /** Default design ID for new parts */
  defaultDesignId?: string
  /** Called when form is submitted. Includes branchId if design is in post-release phase. */
  onSubmit: (data: Part, branchId?: string) => void | Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function PartForm({
  part,
  designs = [],
  defaultDesignId,
  onSubmit,
  onCancel,
  isSubmitting,
}: PartFormProps) {
  const { t } = useTranslation('entities')
  // Track selected design's protection status
  const [selectedBranchId, setSelectedBranchId] = useState<string | undefined>()
  const [attributes, setAttributes] = useState<Record<string, unknown>>(
    part?.attributes ?? {},
  )
  const form = useForm({
    defaultValues: {
      itemType: 'Part' as const,
      weightUnit: 'kg',
      costCurrency: 'USD',
      designId: part?.designId || defaultDesignId || '',
      itemNumber: '',
      name: '',
      description: '',
      partType: undefined as
        'Manufacture' | 'Purchase' | 'Software' | 'Phantom' | undefined,
      trackingMode: 'none' as 'none' | 'lot' | 'serial',
      material: '',
      weight: '',
      cost: '',
      leadTimeDays: undefined as number | undefined,
      ...part,
    },
    validators: {
      onSubmit: zodValidator(partSchema),
    },
    onSubmit: async ({ value }) => {
      const submissionData = {
        ...value,
        attributes,
      } as Part
      // Pass branchId if product is in post-release phase
      await onSubmit(submissionData, selectedBranchId)
    },
  })

  // Watch for design changes and fetch status
  const currentDesignId = useStore(form.store, (state) => state.values.designId)

  const { data: designStatus = null, isFetching: loadingStatus } = useQuery(
    designStatusQuery(currentDesignId, Boolean(currentDesignId)),
  )

  // A different design means a different set of branches, so the pick the
  // user made against the previous one no longer means anything.
  useEffect(() => {
    setSelectedBranchId(undefined)
  }, [currentDesignId])

  // Check if we're in post-release phase and need branch selection
  const isPostRelease = designStatus?.protection.phase === 'post-release'
  // In post-release, branch is required. In pre-release, branch is optional (for private work).
  const showBranchSelector = currentDesignId && !part?.id
  const branchRequired = isPostRelease

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
      data-testid="part-form"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Design - Required for versioning */}
        <form.Field name="designId">
          {(field) => (
            <FormField
              label={t('parts.form.design')}
              required
              error={field.state.meta.errors[0]}
              helpText={t('parts.form.designHelp')}
              className="md:col-span-2"
            >
              <div className="flex items-center gap-4">
                <DesignSelector
                  designs={designs}
                  value={field.state.value}
                  onChange={(value) => field.handleChange(value)}
                  required
                  disabled={!!part?.id}
                />
                {field.state.value && !loadingStatus && designStatus && (
                  <DesignPhaseIndicator
                    designId={field.state.value}
                    status={designStatus}
                  />
                )}
              </div>
            </FormField>
          )}
        </form.Field>

        {/* Branch Selection - Available for new items in both phases */}
        {showBranchSelector && (
          <FormField
            label={t('parts.form.targetBranch')}
            required={branchRequired}
            error={
              branchRequired && !selectedBranchId
                ? t('parts.form.branchRequiredError')
                : undefined
            }
            helpText={
              branchRequired
                ? t('parts.form.branchRequiredHelp')
                : t('parts.form.branchOptionalHelp')
            }
            className="md:col-span-2"
          >
            <BranchSelector
              designId={currentDesignId}
              value={selectedBranchId}
              onChange={setSelectedBranchId}
              showMainOption={!branchRequired}
              placeholder={
                branchRequired ? t('parts.form.branchProtected') : t('parts.form.branchMainDefault')
              }
            />
            {branchRequired && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm rounded-md">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {t('parts.form.branchChangeControlNotice')}
                </span>
              </div>
            )}
            {!branchRequired && !selectedBranchId && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm rounded-md">
                <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>
                  {t('parts.form.branchMainNotice')}
                </span>
              </div>
            )}
          </FormField>
        )}

        {/* Item Number */}
        <form.Field name="itemNumber">
          {(field) => (
            <ItemNumberField
              itemType="Part"
              name={field.name}
              value={field.state.value}
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              error={field.state.meta.errors[0]}
              data-testid="part-item-number"
            />
          )}
        </form.Field>

        {/* Name */}
        <form.Field name="name">
          {(field) => (
            <FormField
              label={t('parts.form.name')}
              error={field.state.meta.errors[0]}
              className="md:col-span-2"
            >
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('parts.form.namePlaceholder')}
                error={!!field.state.meta.errors.length}
                data-testid="part-name"
              />
            </FormField>
          )}
        </form.Field>

        {/* Description */}
        <form.Field name="description">
          {(field) => (
            <FormField
              label={t('parts.form.description')}
              error={field.state.meta.errors[0]}
              className="md:col-span-2"
            >
              <Textarea
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('parts.form.descriptionPlaceholder')}
                rows={4}
                error={!!field.state.meta.errors.length}
              />
            </FormField>
          )}
        </form.Field>

        {/* Type */}
        <form.Field name="partType">
          {(field) => (
            <FormField label={t('parts.form.partType')} error={field.state.meta.errors[0]}>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(
                    value as
                      'Manufacture' | 'Purchase' | 'Software' | 'Phantom',
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('parts.form.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacture">{t('parts.typeLabels.manufacture')}</SelectItem>
                  <SelectItem value="Purchase">{t('parts.typeLabels.purchase')}</SelectItem>
                  <SelectItem value="Software">{t('parts.typeLabels.software')}</SelectItem>
                  <SelectItem value="Phantom">{t('parts.typeLabels.phantom')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>

        {/* Tracking Mode */}
        <form.Field name="trackingMode">
          {(field) => (
            <FormField label={t('parts.form.trackingMode')} error={field.state.meta.errors[0]}>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as 'none' | 'lot' | 'serial')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('parts.form.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('parts.form.tracking.none')}</SelectItem>
                  <SelectItem value="lot">{t('parts.form.tracking.lot')}</SelectItem>
                  <SelectItem value="serial">{t('parts.form.tracking.serial')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>

        {/* Material */}
        <form.Field name="material">
          {(field) => (
            <FormField label={t('parts.form.material')} error={field.state.meta.errors[0]}>
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('parts.form.materialPlaceholder')}
                error={!!field.state.meta.errors.length}
              />
            </FormField>
          )}
        </form.Field>

        {/* Weight */}
        <form.Field name="weight">
          {(field) => (
            <FormField label={t('parts.form.weight')} error={field.state.meta.errors[0]}>
              <div className="flex gap-2">
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  error={!!field.state.meta.errors.length}
                  className="flex-1"
                />
                <form.Field name="weightUnit">
                  {(unitField) => (
                    <Select
                      value={unitField.state.value}
                      onValueChange={(value) => unitField.handleChange(value)}
                    >
                      <SelectTrigger className="!w-20 !px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="lb">lb</SelectItem>
                        <SelectItem value="oz">oz</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
              </div>
            </FormField>
          )}
        </form.Field>

        {/* Cost */}
        <form.Field name="cost">
          {(field) => (
            <FormField label={t('parts.form.cost')} error={field.state.meta.errors[0]}>
              <div className="flex gap-2">
                <form.Field name="costCurrency">
                  {(currencyField) => (
                    <Select
                      value={currencyField.state.value}
                      onValueChange={(value) =>
                        currencyField.handleChange(value)
                      }
                    >
                      <SelectTrigger className="!w-20 !px-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="JPY">JPY</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </form.Field>
                <Input
                  name={field.name}
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  error={!!field.state.meta.errors.length}
                  className="flex-1"
                />
              </div>
            </FormField>
          )}
        </form.Field>

        {/* Lead Time */}
        <form.Field name="leadTimeDays">
          {(field) => (
            <FormField
              label={t('parts.form.leadTime')}
              error={field.state.meta.errors[0]}
            >
              <Input
                name={field.name}
                value={field.state.value ?? ''}
                onChange={(e) => {
                  const value = e.target.value
                  field.handleChange(value ? parseInt(value, 10) : undefined)
                }}
                onBlur={field.handleBlur}
                type="number"
                placeholder="30"
                error={!!field.state.meta.errors.length}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      {/* Custom Attributes */}
      <AttributesEditor
        value={attributes}
        onChange={setAttributes}
        disabled={isSubmitting}
      />

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="part-cancel"
          >
            {t('parts.form.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || (branchRequired && !selectedBranchId)}
          data-testid="part-submit"
        >
          {isSubmitting
            ? t('parts.form.saving')
            : part?.id
              ? t('parts.form.updatePart')
              : t('parts.form.createPart')}
        </Button>
      </div>
    </form>
  )
}
