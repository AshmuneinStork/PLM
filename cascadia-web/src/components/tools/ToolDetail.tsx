// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { Link } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Edit, Save, Trash2, X } from 'lucide-react'
import {
  TOOL_SUBTYPES,
  getSubtypeGroup,
} from '@cascadia/commons/items/types/tool'
import { CapabilitiesEditor, CapabilitiesView } from './CapabilitiesEditor'
import type { KnownToolSubtype, Tool } from '@cascadia/commons/items/types/tool'
import type { SearchableSelectOption } from '@/components/ui/SearchableSelect'
import type { EnrichmentResult } from '@/components/items/useDropEnrichment'
import type { EnrichmentSources } from '@/components/items/enrichment-sources'
import { PageContainer } from '@/components/layout'
import {
  AttributesEditor,
  formatAttributeValue,
} from '@/components/items/AttributesEditor'
import { DropOverlay } from '@/components/items/DropOverlay'
import { useDropEnrichment } from '@/components/items/useDropEnrichment'
import {
  describeEnrichment,
  fillEmptyFields,
  mergeEnrichmentAttributes,
} from '@/components/items/apply-enrichment'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { ItemHistoryTab } from '@/components/items/ItemHistoryTab'
import { ITEM_NUMBER_PLACEHOLDER } from '@/items/numbering/format'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SearchableSelect,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ViewEditSelect,
  ViewEditStatic,
  ViewEditText,
  ViewEditTextarea,
} from '@/components/ui'
import { useAlertDialog } from '@/hooks/useAlertDialog'
import { StateBadge } from '@/components/items/StateBadge'
import { FreeTransitionControl } from '@/components/items/FreeTransitionControl'

// Tool type options match lifecycle: manufacturing | quality | utility
const TOOL_TYPE_VALUES = ['manufacturing', 'quality', 'utility'] as const

function subtypeLabel(subtype?: string): string {
  if (!subtype) return '-'
  const known = TOOL_SUBTYPES[subtype as KnownToolSubtype] as
    { label: string } | undefined
  return known ? known.label : subtype
}

const createEmptyTool = (): Tool => ({
  id: undefined,
  masterId: undefined,
  itemType: 'Tool',
  itemNumber: '',
  name: '',
  state: '',
  isCurrent: true,
  toolType: 'manufacturing',
  toolSubtype: '',
  manufacturer: '',
  model: '',
  capabilities: {},
  location: '',
  notes: '',
})

/**
 * The tabs this detail view renders. The route's search schema derives its
 * `tab` enum from this list, so the URL contract and the rendered tabs
 * cannot drift apart; the `onValueChange` cast below is the one seam where
 * Radix's `string` meets it, and the triggers are rendered from the same
 * source of truth.
 */
export const TOOL_DETAIL_TABS = ['details', 'history'] as const
export type ToolDetailTab = (typeof TOOL_DETAIL_TABS)[number]

interface ToolDetailProps {
  /** Called after a lifecycle transition succeeds (refresh the item) */
  onTransitioned?: () => void
  tool?: Tool
  onSave: (tool: Tool) => Promise<void>
  onDelete?: () => Promise<void>
  onCancel: () => void
  isSubmitting?: boolean
  activeTab?: ToolDetailTab
  onTabChange?: (tab: ToolDetailTab) => void
}

export function ToolDetail({
  onTransitioned,
  tool: initialTool,
  onSave,
  onDelete,
  onCancel,
  isSubmitting = false,
  activeTab = 'details',
  onTabChange,
}: ToolDetailProps) {
  const { t } = useTranslation('entities')
  const typeOptions = TOOL_TYPE_VALUES.map((value) => ({
    value,
    label: t(`tools.typeLabels.${value}`),
  }))
  const { confirm } = useAlertDialog()

  const isCreateMode = !initialTool?.id

  const [tool, setTool] = useState<Tool>(() => initialTool || createEmptyTool())
  const [isEditing, setIsEditing] = useState(isCreateMode)
  const [capabilities, setCapabilities] = useState<Record<string, unknown>>(
    initialTool?.capabilities ?? {},
  )
  const [attributes, setAttributes] = useState<Record<string, unknown>>(
    initialTool?.attributes ?? {},
  )

  const { showSuccess, showInfo } = useErrorHandler()

  useEffect(() => {
    if (initialTool) {
      setTool(initialTool)
      setCapabilities(initialTool.capabilities ?? {})
      setAttributes(initialTool.attributes ?? {})
    }
  }, [initialTool])

  const currentTool = tool

  const updateField = (field: keyof Tool, value: any) => {
    setTool((prev) => ({ ...prev, [field]: value }))
  }

  // Drag-and-drop (or paste) a web link or images onto the create form to
  // auto-fill it. The merge rules live in apply-enrichment.ts, shared with
  // the Part form: suggestions fill empty or still-default fields only.
  const applyEnrichment = useCallback(
    (result: EnrichmentResult, sources: EnrichmentSources) => {
      setAttributes((prev) => mergeEnrichmentAttributes(prev, result))
      setTool((prev) => fillEmptyFields(prev, createEmptyTool(), result.fields))

      // Capabilities belong to a subtype, so they are taken only when the
      // form will end up on the suggested one: the subtype was still unset
      // (the fill above sets it) or already matched. Existing keys win.
      const suggestedSubtype = result.fields.toolSubtype
      const currentSubtype = tool.toolSubtype
      if (
        result.capabilities &&
        typeof suggestedSubtype === 'string' &&
        (!currentSubtype || currentSubtype === suggestedSubtype)
      ) {
        const suggested = result.capabilities
        setCapabilities((prev) => ({ ...suggested, ...prev }))
      }

      const notice = describeEnrichment(result, sources)
      const show = notice.variant === 'success' ? showSuccess : showInfo
      show(notice.title, notice.description)
    },
    [tool.toolSubtype, showSuccess, showInfo],
  )

  const { isDragging, enriching, dropHandlers } = useDropEnrichment({
    itemType: 'Tool',
    enabled: isCreateMode,
    onEnriched: applyEnrichment,
  })

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    const toolToSave = {
      ...tool,
      attributes,
      capabilities:
        Object.keys(capabilities).length > 0 ? capabilities : undefined,
    }
    await onSave(toolToSave)
    if (!isCreateMode) setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (isCreateMode) {
      onCancel()
    } else {
      setTool(initialTool)
      setCapabilities(initialTool.capabilities ?? {})
      setAttributes(initialTool.attributes ?? {})
      setIsEditing(false)
    }
  }

  const handleDelete = () => {
    if (!onDelete || !currentTool.id) return
    confirm({
      title: t('tools.header.deleteTitle'),
      description: t('tools.dialogs.deleteBody', {
        itemNumber: currentTool.itemNumber,
      }),
      actionLabel: t('tools.header.delete'),
      cancelLabel: t('tools.header.cancel'),
      variant: 'destructive',
      onConfirm: onDelete,
    })
  }

  const formatDate = (date?: string | Date) => {
    if (!date) return '-'
    try {
      return new Date(date).toLocaleDateString()
    } catch {
      return '-'
    }
  }

  // Filter subtypes by current tool type, with group labels for searchable dropdown
  const subtypeOptions: Array<SearchableSelectOption> = Object.entries(
    TOOL_SUBTYPES,
  )
    .filter(
      ([, meta]) =>
        meta.toolType === (isEditing ? tool.toolType : currentTool.toolType),
    )
    .map(([key, meta]) => ({
      value: key,
      label: meta.label,
      group: getSubtypeGroup(key),
    }))

  return (
    <div className="relative" {...dropHandlers}>
      <PageContainer>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/tools">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                {isCreateMode
                  ? t('tools.header.createTitle')
                  : currentTool.itemNumber}
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                {isCreateMode
                  ? t('tools.header.createSubtitle')
                  : currentTool.name || t('tools.header.unnamed')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  {t('tools.header.cancel')}
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? t('tools.header.saving')
                    : isCreateMode
                      ? t('tools.header.createTool')
                      : t('tools.header.saveChanges')}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t('tools.header.edit')}
                </Button>
                {onDelete && (
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('tools.header.delete')}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {!isCreateMode && (
          <div className="flex gap-2">
            <StateBadge
              itemType="Tool"
              state={currentTool.state}
              className="text-sm"
            />
            {currentTool.id && (
              <FreeTransitionControl
                itemId={currentTool.id}
                state={currentTool.state}
                onTransitioned={onTransitioned}
              />
            )}
          </div>
        )}

        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange?.(value as ToolDetailTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('tools.tabs.details')}</TabsTrigger>
            <TabsTrigger value="history">{t('tools.tabs.history')}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Overview Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('tools.detail.overviewTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ViewEditText
                        label={t('tools.table.itemNumber')}
                        value={
                          isEditing ? tool.itemNumber : currentTool.itemNumber
                        }
                        onChange={(v) => updateField('itemNumber', v)}
                        isEditing={isEditing && isCreateMode}
                        placeholder={ITEM_NUMBER_PLACEHOLDER}
                      />
                      <ViewEditText
                        label={t('tools.form.name')}
                        value={isEditing ? tool.name : currentTool.name}
                        onChange={(v) => updateField('name', v)}
                        isEditing={isEditing}
                        placeholder={t('tools.form.namePlaceholder')}
                        required
                      />
                    </dl>
                  </CardContent>
                </Card>

                {/* Tool Information Card */}
                <Card>
                  <CardHeader>
                      <CardTitle>{t('tools.detail.toolInfoTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ViewEditSelect
                        label={t('tools.form.toolType')}
                        value={isEditing ? tool.toolType : currentTool.toolType}
                        onChange={(v) => updateField('toolType', v)}
                        isEditing={isEditing}
                        options={typeOptions}
                      />
                      {isEditing ? (
                        <div>
                          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                            {t('tools.form.subtype')}
                          </dt>
                          <dd>
                            <SearchableSelect
                              value={tool.toolSubtype || ''}
                              onValueChange={(v) =>
                                updateField('toolSubtype', v)
                              }
                              options={[
                                ...subtypeOptions,
                                { value: 'other', label: t('tools.typeLabels.other') },
                              ]}
                              placeholder={t('tools.form.searchSubtypes')}
                              searchPlaceholder={t('tools.form.filterSubtypes')}
                            />
                          </dd>
                        </div>
                      ) : (
                        <ViewEditStatic
                        label={t('tools.form.subtype')}
                          value={subtypeLabel(currentTool.toolSubtype)}
                        />
                      )}
                      <ViewEditText
                        label={t('tools.form.manufacturer')}
                        value={
                          isEditing
                            ? tool.manufacturer
                            : currentTool.manufacturer
                        }
                        onChange={(v) => updateField('manufacturer', v)}
                        isEditing={isEditing}
                        placeholder={t('tools.form.manufacturerPlaceholder')}
                      />
                      <ViewEditText
                        label={t('tools.form.model')}
                        value={isEditing ? tool.model : currentTool.model}
                        onChange={(v) => updateField('model', v)}
                        isEditing={isEditing}
                        placeholder={t('tools.form.modelPlaceholder')}
                      />
                    </dl>
                  </CardContent>
                </Card>

                {/* Capabilities Card */}
                {(isEditing ||
                  (currentTool.capabilities &&
                    Object.keys(currentTool.capabilities).length > 0)) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('tools.detail.capabilitiesTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <CapabilitiesEditor
                          subtype={tool.toolSubtype || ''}
                          capabilities={capabilities}
                          onChange={setCapabilities}
                        />
                      ) : (
                        <CapabilitiesView
                          capabilities={currentTool.capabilities ?? {}}
                        />
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                      <CardTitle>{t('tools.detail.statusLocationTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ViewEditText
                      label={t('tools.form.location')}
                      value={isEditing ? tool.location : currentTool.location}
                      onChange={(v) => updateField('location', v)}
                      isEditing={isEditing}
                      placeholder={t('tools.form.locationPlaceholder')}
                    />
                  </CardContent>
                </Card>

                {/* Notes */}
                <Card>
                  <CardHeader>
                      <CardTitle>{t('tools.detail.notesTitle')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ViewEditTextarea
                      label=""
                      value={isEditing ? tool.notes : currentTool.notes}
                      onChange={(v) => updateField('notes', v)}
                      isEditing={isEditing}
                      placeholder={t('tools.form.notesPlaceholder')}
                    />
                  </CardContent>
                </Card>

                {/* Custom Attributes */}
                {isEditing ? (
                  <Card>
                    <AttributesEditor
                      value={attributes}
                      onChange={setAttributes}
                      disabled={isSubmitting}
                      className="border-0 rounded-none"
                    />
                  </Card>
                ) : (
                  <Card>
                    <Collapsible
                      defaultOpen={
                        Object.keys(currentTool.attributes ?? {}).length > 0
                      }
                    >
                      <CardHeader className="pb-3">
                        <CollapsibleTrigger className="hover:opacity-70">
                          <CardTitle>{t('tools.detail.attributesTitle')}</CardTitle>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {Object.keys(currentTool.attributes ?? {}).length >
                          0 ? (
                            <dl className="space-y-3">
                              {Object.entries(currentTool.attributes ?? {}).map(
                                ([key, value]) => (
                                  <div key={key} className="space-y-1">
                                    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                      {key}
                                    </dt>
                                    <dd className="text-sm text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-md">
                                      {formatAttributeValue(value) || '-'}
                                    </dd>
                                  </div>
                                ),
                              )}
                            </dl>
                          ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {t('tools.detail.noAttributes')}
                            </p>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                )}

                <Collapsible defaultOpen={false}>
                  <Card>
                    <CardHeader>
                      <CollapsibleTrigger className="hover:opacity-70">
                        <CardTitle>{t('tools.detail.metadataTitle')}</CardTitle>
                      </CollapsibleTrigger>
                    </CardHeader>
                    <CollapsibleContent>
                      <CardContent className="space-y-3">
                        <ViewEditStatic
                          label={t('tools.detail.revisionLabel')}
                          value={currentTool.revision}
                        />
                        <ViewEditStatic
                          label={t('tools.detail.createdLabel')}
                          value={formatDate(currentTool.createdAt)}
                        />
                        <ViewEditStatic
                          label={t('tools.detail.modifiedLabel')}
                          value={formatDate(currentTool.modifiedAt)}
                        />
                        {!isCreateMode && (
                          <ViewEditStatic
                            label={t('tools.detail.toolIdLabel')}
                            value={currentTool.id}
                            mono
                          />
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {currentTool.id ? (
              <ItemHistoryTab
                itemId={currentTool.id}
                designId={currentTool.designId ?? null}
                versionContext={{ type: 'main' }}
                onViewHistoricalState={() => {}}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-slate-500">
                    {t('tools.detail.saveFirstHistory')}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </PageContainer>
      <DropOverlay isDragging={isDragging} enriching={enriching} />
    </div>
  )
}
