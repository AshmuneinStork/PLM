// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useForm } from '@tanstack/react-form'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changeOrderSchema } from '@cascadia/commons/items/types/change-order'
import type { ChangeOrder } from '@cascadia/commons/items/types/change-order'
import { AttributesEditor } from '@/components/items/AttributesEditor'
import { getItemNumberHelpText } from '@/items/numbering/format'
import { zodValidator } from '@/form-validation'
import {
  Button,
  Checkbox,
  FormField,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'

interface ChangeOrderFormProps {
  changeOrder?: Partial<ChangeOrder>
  onSubmit: (data: ChangeOrder) => void | Promise<void>
  onCancel?: () => void
  isSubmitting?: boolean
}

export function ChangeOrderForm({
  changeOrder,
  onSubmit,
  onCancel,
  isSubmitting,
}: ChangeOrderFormProps) {
  const { t } = useTranslation('entities')
  const [attributes, setAttributes] = useState<Record<string, unknown>>(
    changeOrder?.attributes ?? {},
  )
  const form = useForm({
    defaultValues: {
      itemType: 'ChangeOrder' as const,
      changeType: 'ECO' as const,
      priority: 'medium' as const,
      itemNumber: '',
      name: '',
      reasonForChange: '',
      impactDescription: '',
      implementationDate: '',
      isBaseline: false,
      baselineName: '',
      ...changeOrder,
    },
    validators: {
      onSubmit: zodValidator(changeOrderSchema),
    },
    onSubmit: async ({ value }) => {
      // Convert empty strings to undefined for optional fields
      // Zod's .optional() allows undefined but not empty strings
      const submissionData = {
        ...value,
        itemNumber: value.itemNumber.trim() || undefined,
        name: value.name.trim() || undefined,
        reasonForChange: value.reasonForChange.trim() || undefined,
        impactDescription: value.impactDescription.trim() || undefined,
        implementationDate: value.implementationDate || undefined,
        baselineName: value.baselineName.trim() || undefined,
        attributes,
      } as ChangeOrder
      await onSubmit(submissionData)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
      data-testid="change-order-form"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Item Number - Always auto-generated for Change Orders */}
        <FormField
          label={t('change-orders.form.numberLabel')}
          helpText={getItemNumberHelpText('ChangeOrder')}
        >
          <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-muted-foreground">
            {t('change-orders.form.autoValue')}
          </div>
        </FormField>

        {/* Name */}
        <form.Field name="name">
          {(field) => (
            <FormField
              label={t('change-orders.form.name')}
              error={field.state.meta.errors[0]}
              className="md:col-span-2"
              helpText={t('change-orders.form.nameHint')}
            >
              <Input
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder="Widget material change from steel to aluminum"
                error={!!field.state.meta.errors.length}
                data-testid="change-order-name"
              />
            </FormField>
          )}
        </form.Field>

        {/* Change Type */}
        <form.Field name="changeType">
          {(field) => (
            <FormField
              label={t('change-orders.form.changeType')}
              required
              error={field.state.meta.errors[0]}
              helpText={t('change-orders.form.changeTypeHint')}
            >
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(
                    value as 'ECO' | 'ECN' | 'MCO' | 'Deviation' | 'XCO',
                  )
                }
              >
                <SelectTrigger error={!!field.state.meta.errors.length}>
                  <SelectValue placeholder={t('change-orders.form.changeTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ECO">
                    ECO - Engineering Change Order
                  </SelectItem>
                  <SelectItem value="ECN">
                    ECN - Engineering Change Notice
                  </SelectItem>
                  <SelectItem value="MCO">
                    MCO - Manufacturing Change Order
                  </SelectItem>
                  <SelectItem value="Deviation">{t('change-orders.form.deviation')}</SelectItem>
                  <SelectItem value="XCO">
                    XCO - Flexible Change Order
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>

        {/* Priority */}
        <form.Field name="priority">
          {(field) => (
            <FormField
              label={t('change-orders.form.priority')}
              error={field.state.meta.errors[0]}
              helpText={t('change-orders.form.priorityHint')}
            >
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(
                    value as 'low' | 'medium' | 'high' | 'critical',
                  )
                }
              >
                <SelectTrigger error={!!field.state.meta.errors.length}>
                  <SelectValue placeholder={t('change-orders.form.priorityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('change-orders.form.low')}</SelectItem>
                  <SelectItem value="medium">{t('change-orders.form.medium')}</SelectItem>
                  <SelectItem value="high">{t('change-orders.form.high')}</SelectItem>
                  <SelectItem value="critical">{t('change-orders.form.critical')}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          )}
        </form.Field>

        {/* Reason for Change */}
        <form.Field name="reasonForChange">
          {(field) => (
            <FormField
              label={t('change-orders.form.reason')}
              error={field.state.meta.errors[0]}
              className="md:col-span-2"
              helpText={t('change-orders.form.reasonHint')}
            >
              <Textarea
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('change-orders.form.reasonPlaceholder')}
                rows={4}
                error={!!field.state.meta.errors.length}
              />
            </FormField>
          )}
        </form.Field>

        {/* Impact Description */}
        <form.Field name="impactDescription">
          {(field) => (
            <FormField
              label={t('change-orders.form.impact')}
              error={field.state.meta.errors[0]}
              className="md:col-span-2"
              helpText={t('change-orders.form.impactHint')}
            >
              <Textarea
                name={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('change-orders.form.impactPlaceholder')}
                rows={4}
                error={!!field.state.meta.errors.length}
              />
            </FormField>
          )}
        </form.Field>

        {/* Implementation Date */}
        <form.Field name="implementationDate">
          {(field) => (
            <FormField
              label={t('change-orders.form.targetDate')}
              error={field.state.meta.errors[0]}
              helpText={t('change-orders.form.targetDateHint')}
            >
              <Input
                name={field.name}
                value={
                  field.state.value instanceof Date
                    ? field.state.value.toISOString().split('T')[0]
                    : (field.state.value ?? '')
                }
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                type="date"
                error={!!field.state.meta.errors.length}
              />
            </FormField>
          )}
        </form.Field>
      </div>

      {/* Baseline Section */}
      <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
        <div className="space-y-4">
          <form.Field name="isBaseline">
            {(field) => (
              <div className="flex items-center gap-3">
                <Checkbox
                  id="isBaseline"
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                />
                <Label
                  htmlFor="isBaseline"
                  className="font-medium cursor-pointer"
                >
                  {t('change-orders.form.baselineToggle')}
                </Label>
              </div>
            )}
          </form.Field>

          <form.Field name="isBaseline">
            {(isBaselineField) =>
              isBaselineField.state.value && (
                <form.Field name="baselineName">
                  {(field) => (
                    <FormField
                      label={t('change-orders.form.baselineName')}
                      required
                      error={field.state.meta.errors[0]}
                      helpText={t('change-orders.form.baselineHint')}
                    >
                      <Input
                        name={field.name}
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        placeholder={t('change-orders.form.baselinePlaceholder')}
                        error={!!field.state.meta.errors.length}
                      />
                    </FormField>
                  )}
                </form.Field>
              )
            }
          </form.Field>

          <p className="text-sm text-muted-foreground">
            {t('change-orders.form.baselineInfo')}


          </p>
        </div>
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
          >
            {t('change-orders.form.cancel')}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          data-testid="change-order-submit"
        >
          {isSubmitting
            ? t('change-orders.form.saving')
            : changeOrder?.id
              ? t('change-orders.form.updateAction')
              : t('change-orders.form.createAction')}
        </Button>
      </div>
    </form>
  )
}
