// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  AlertTriangle,
  Box,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  Loader2,
  Plus,
  Users,
} from 'lucide-react'
import { formatRevision } from '@cascadia/commons/types/lifecycle'
import { formatCrossDesignSummaryI18n, getImpactI18nHelpers } from './impact-i18n'
import type { LucideIcon } from 'lucide-react'
import type { Risk } from '@cascadia/commons/items/types/change-order'
import { apiFetch } from '@/api/client'
import { useInvalidateResources } from '@/query/hooks'
import { changeOrderImpactReportQuery } from '@/query/options/change-orders'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui'

interface WhereUsedNode {
  itemId: string
  masterId?: string
  itemNumber: string
  revision: string
  name: string
  itemType: string
  state: string
  depth: number
  designId?: string | null
  designCode?: string | null
  designName?: string | null
  affectedByCount?: number
  sourceAffectedItems?: Array<{
    affectedItemId: string
    itemNumber: string
    changeAction: string
  }>
  recommendation?: 'revise' | null
}

type ImpactRelationshipType =
  | 'bom_where_used'
  | 'definition_instance'
  | 'definition_source'
  | 'usage_cousin'
  | 'cross_design_ref'

interface CrossDesignImpactedPart {
  itemId: string
  itemNumber: string
  name: string
  changeAction: string
  revision: string
  relationshipType?: ImpactRelationshipType
  relationshipLabel?: string
  // The item in the external design that is impacted
  targetItemId?: string
  targetItemNumber?: string
  targetItemName?: string
}

interface CrossDesignImpact {
  designId: string
  designCode: string
  designName: string
  impactedParts: Array<CrossDesignImpactedPart>
  summary: Record<string, number>
  relationshipSummary?: Record<string, number>
}

export interface ImpactData {
  whereUsed: Array<WhereUsedNode>
  documents: Array<any>
  relatedChanges: Array<any>
  totalImpactedItems: number
  maxDepth: number
  risks: Array<Risk>
  crossDesignImpacts?: Array<CrossDesignImpact>
}

export interface ImpactAssessmentPanelProps {
  changeOrderId: string
  impactData?: ImpactData | null
  isLoading?: boolean
  onRunAssessment?: () => void | Promise<void>
}

const riskSeverityColors: Record<
  string,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  low: 'success',
  medium: 'warning',
  high: 'destructive',
  critical: 'destructive',
}

const riskCategoryIcons: Record<string, any> = {
  production: GitBranch,
  compliance: FileText,
  schedule: AlertTriangle,
  quality: CheckCircle,
  cost: AlertCircle,
  inventory: AlertCircle,
  'cross-design': Layers,
}

const changeActionColors: Record<
  string,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  revise: 'warning',
  release: 'success',
  obsolete: 'destructive',
  add: 'default',
  remove: 'destructive',
}

const relationshipTypeLabelKeys: Record<string, string> = {
  bom_where_used: 'change-orders.panels.impact.relBomWhereUsed',
  definition_instance: 'change-orders.panels.impact.relDefinitionInstance',
  definition_source: 'change-orders.panels.impact.relDefinitionSource',
  usage_cousin: 'change-orders.panels.impact.relUsageCousin',
  cross_design_ref: 'change-orders.panels.impact.relCrossDesignRef',
}

const relationshipTypeIcons: Record<string, LucideIcon> = {
  bom_where_used: GitBranch,
  definition_instance: Box,
  definition_source: Box,
  usage_cousin: Users,
  cross_design_ref: ExternalLink,
}

function RelationshipGroup({
  type,
  parts,
  designId,
}: {
  type: string
  parts: Array<CrossDesignImpactedPart>
  designId: string
}) {
  const { t } = useTranslation('entities')
  const { actionLabel } = getImpactI18nHelpers(t)
  const [expanded, setExpanded] = useState(false)
  const Icon = relationshipTypeIcons[type] ?? GitBranch
  const label = t(relationshipTypeLabelKeys[type] ?? type, { defaultValue: type })
  const visibleParts = expanded ? parts : parts.slice(0, 3)
  const hasMore = parts.length > 3

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 py-1">
        <Icon className="h-4 w-4" />
        {label} ({parts.length})
      </div>
      <div className="ml-6 space-y-1">
        {visibleParts.map((part) => (
          <div
            key={`${designId}-${part.itemId}-${part.targetItemId ?? ''}-${type}`}
            className="py-1.5 text-sm space-y-0.5"
          >
            {part.targetItemNumber && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{t('change-orders.panels.impact.impactedLabel')}</span>
                <span className="font-mono text-slate-300">
                  {part.targetItemNumber}
                </span>
                <span className="flex-1 truncate text-slate-500">
                  {part.targetItemName}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              {part.targetItemNumber && (
                <span className="text-xs text-slate-500">{t('change-orders.panels.impact.sourceLabel')}</span>
              )}
              <span className="font-mono">{part.itemNumber}</span>
              <span className="text-slate-400">
                {formatRevision(part.revision)}
              </span>
              <span className="flex-1 truncate text-slate-600 dark:text-slate-400">
                {part.name}
              </span>
              <Badge
                variant={changeActionColors[part.changeAction] ?? 'secondary'}
                className="text-xs"
              >
                {actionLabel(part.changeAction)}
              </Badge>
            </div>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 py-1"
          >
            {expanded ? (
              <>
                <ChevronDown className="h-4 w-4" />
                {t('change-orders.panels.impact.showLess')}
              </>
            ) : (
              <>
                <ChevronRight className="h-4 w-4" />{t('change-orders.panels.impact.moreItems', { count: parts.length - 3 })}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

function CrossDesignImpactCard({
  impacts,
}: {
  impacts: Array<CrossDesignImpact>
}) {
  const { t } = useTranslation('entities')
  const { relLabel, actionLabel } = getImpactI18nHelpers(t)
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-blue-500" />
            {t('change-orders.panels.impact.crossDesignTitle')}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {impacts.map((impact) => {
            const hasRelationshipSummary =
              impact.relationshipSummary &&
              Object.keys(impact.relationshipSummary).length > 0

            // Group parts by relationship type (default to bom_where_used)
            const partsByType = new Map<
              string,
              Array<CrossDesignImpactedPart>
            >()
            for (const part of impact.impactedParts) {
              const type = part.relationshipType ?? 'bom_where_used'
              if (!partsByType.has(type)) {
                partsByType.set(type, [])
              }
              partsByType.get(type)!.push(part)
            }

            return (
              <div
                key={impact.designId}
                className="border rounded-lg overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">
                        {impact.designCode}
                      </span>
                      <span className="text-slate-500">
                        {impact.designName !== impact.designCode &&
                          impact.designName}
                      </span>
                      <Badge variant="secondary">
                        {t('change-orders.panels.impact.partCount', { count: impact.impactedParts.length })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {Object.entries(impact.summary).map(([action, count]) => (
                        <Badge
                          key={action}
                          variant={changeActionColors[action] ?? 'secondary'}
                          className="text-xs"
                        >
                          {count} {actionLabel(action)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {/* Relationship type badges */}
                  {hasRelationshipSummary && (
                    <div className="flex items-center gap-1 mb-2">
                      {Object.entries(impact.relationshipSummary!).map(
                        ([type, count]) => {
                          const Icon = relationshipTypeIcons[type] ?? GitBranch
                          return (
                            <Badge
                              key={type}
                              variant="secondary"
                              className="text-xs flex items-center gap-1"
                            >
                              <Icon className="h-3 w-3" />
                              {count} {relLabel(type)}
                            </Badge>
                          )
                        },
                      )}
                    </div>
                  )}
                  <p className="text-sm text-slate-500">
                    {formatCrossDesignSummaryI18n(t, impact)}
                  </p>
                </div>

                <div className="border-t px-4 py-2 space-y-2">
                  {hasRelationshipSummary && partsByType.size > 1 ? (
                    // Group by relationship type with sub-headers
                    Array.from(partsByType.entries()).map(([type, parts]) => (
                      <RelationshipGroup
                        key={type}
                        type={type}
                        parts={parts}
                        designId={impact.designId}
                      />
                    ))
                  ) : (
                    // Flat list (old format or single type)
                    <FlatPartsList
                      parts={impact.impactedParts}
                      designId={impact.designId}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function FlatPartsList({
  parts,
  designId,
}: {
  parts: Array<CrossDesignImpactedPart>
  designId: string
}) {
  const { t } = useTranslation('entities')
  const { actionLabel } = getImpactI18nHelpers(t)
  const [expanded, setExpanded] = useState(false)
  const visibleParts = expanded ? parts : parts.slice(0, 5)
  const hasMore = parts.length > 5

  return (
    <div className="space-y-1">
      {visibleParts.map((part) => (
        <div
          key={`${designId}-${part.itemId}-${part.targetItemId ?? ''}`}
          className="py-1.5 text-sm space-y-0.5"
        >
          {part.targetItemNumber && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{t('change-orders.panels.impact.impactedLabel')}</span>
              <span className="font-mono text-slate-300">
                {part.targetItemNumber}
              </span>
              <span className="flex-1 truncate text-slate-500">
                {part.targetItemName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {part.targetItemNumber && (
              <span className="text-xs text-slate-500">{t('change-orders.panels.impact.sourceLabel')}</span>
            )}
            <span className="font-mono">{part.itemNumber}</span>
            <span className="text-slate-400">
              {formatRevision(part.revision)}
            </span>
            <span className="flex-1 truncate text-slate-600 dark:text-slate-400">
              {part.name}
            </span>
            <Badge
              variant={changeActionColors[part.changeAction] ?? 'secondary'}
              className="text-xs"
            >
              {actionLabel(part.changeAction)}
            </Badge>
          </div>
        </div>
      ))}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 py-1"
        >
          {expanded ? (
            <>
              <ChevronDown className="h-4 w-4" />
              {t('change-orders.panels.impact.showLess')}
            </>
          ) : (
            <>
              <ChevronRight className="h-4 w-4" />{t('change-orders.panels.impact.moreParts', { count: parts.length - 5 })}
            </>
          )}
        </button>
      )}
    </div>
  )
}

export function ImpactAssessmentPanel({
  changeOrderId,
  impactData: externalImpactData,
  isLoading: externalIsLoading,
  onRunAssessment: externalOnRunAssessment,
}: ImpactAssessmentPanelProps) {
  const { t } = useTranslation('entities')
  const { riskSeverity } = getImpactI18nHelpers(t)
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set())
  const [addedToChangeOrder, setAddedToChangeOrder] = useState<Set<string>>(
    new Set(),
  )
  const [addToChangeOrderErrors, setAddToChangeOrderErrors] = useState<
    Record<string, string>
  >({})
  const [running, setRunning] = useState(false)

  const invalidate = useInvalidateResources()

  // The panel has two modes: a parent may own the data and pass it in, or the
  // panel fetches its own. Only the self-managed mode reads the stored report.
  const selfManaged = !externalImpactData && !externalOnRunAssessment
  const { data: storedReport, isPending: loadingStoredReport } = useQuery(
    changeOrderImpactReportQuery<ImpactData>(changeOrderId, selfManaged),
  )

  const impactData = externalImpactData ?? storedReport ?? null
  const isLoading =
    externalIsLoading ?? ((loadingStoredReport && selfManaged) || running)

  // Running an assessment writes a new report; the query above re-reads it.
  const runAssessment = useCallback(async () => {
    setRunning(true)
    try {
      await apiFetch(
        `/api/v1/change-orders/${changeOrderId}/impact-assessment`,
        { method: 'POST' },
      )
      await invalidate('change-orders')
    } finally {
      setRunning(false)
    }
  }, [changeOrderId, invalidate])

  const handleRunAssessment = useCallback(async () => {
    if (externalOnRunAssessment) {
      await externalOnRunAssessment()
      return
    }
    await runAssessment()
  }, [externalOnRunAssessment, runAssessment])

  // Handle "Add to Change Order" action
  const handleAddToChangeOrder = useCallback(
    async (node: WhereUsedNode) => {
      const nodeKey = node.masterId ?? node.itemId
      try {
        await apiFetch(
          `/api/v1/change-orders/${changeOrderId}/affected-items`,
          {
            method: 'POST',
            body: JSON.stringify({
              affectedItemId: node.itemId,
              changeAction: 'revise',
            }),
          },
        )
        setAddedToChangeOrder((prev) => new Set(prev).add(nodeKey))
        setAddToChangeOrderErrors((prev) => {
          const next = { ...prev }
          delete next[nodeKey]
          return next
        })
      } catch (err: any) {
        const message =
          err?.data?.error ??
          err?.message ??
          t('change-orders.panels.impact.addFailed')
        setAddToChangeOrderErrors((prev) => ({ ...prev, [nodeKey]: message }))
      }
    },
    [changeOrderId],
  )

  if (!impactData && !isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('change-orders.panels.impact.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {t('change-orders.panels.impact.notRun')}
            </p>
            <Button onClick={handleRunAssessment}>{t('change-orders.panels.impact.runAction')}</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('change-orders.panels.impact.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto text-slate-400 mb-4 animate-spin" />
            <p className="text-slate-500 dark:text-slate-400">
              {t('change-orders.panels.impact.analyzing')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!impactData) return null

  // Group where-used by depth for hierarchical display (with defensive dedup for old reports)
  const whereUsedByDepth = impactData.whereUsed.reduce(
    (acc, node) => {
      const bucket = (acc[node.depth] ??= [])
      // Dedup by masterId (falls back to itemId for old reports without masterId)
      const dedupKey = node.masterId ?? node.itemId
      if (!bucket.some((n) => (n.masterId ?? n.itemId) === dedupKey)) {
        bucket.push(node)
      }
      return acc
    },
    {} as Record<number, Array<WhereUsedNode>>,
  )

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('change-orders.panels.impact.summaryTitle')}</CardTitle>
            <Button variant="outline" size="sm" onClick={handleRunAssessment}>
              {t('change-orders.panels.impact.refreshAction')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {impactData.totalImpactedItems}
              </div>
              <div className="text-sm text-slate-500">{t('change-orders.panels.impact.totalImpacted')}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {impactData.whereUsed.length}
              </div>
              <div className="text-sm text-slate-500">
                {t('change-orders.panels.impact.whereUsedAssemblies')}
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">{impactData.maxDepth}</div>
              <div className="text-sm text-slate-500">{t('change-orders.panels.impact.maxDepth')}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {impactData.risks.length}
              </div>
              <div className="text-sm text-slate-500">{t('change-orders.panels.impact.identifiedRisks')}</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold">
                {impactData.crossDesignImpacts?.length ?? 0}
              </div>
              <div className="text-sm text-slate-500">{t('change-orders.panels.impact.externalDesigns')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risks Card */}
      {impactData.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('change-orders.panels.impact.risksTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {impactData.risks.map((risk, idx) => {
                const Icon = riskCategoryIcons[risk.category] || AlertCircle
                return (
                  <div
                    key={idx}
                    className="p-4 border rounded-lg flex items-start gap-3"
                  >
                    <Icon className="h-5 w-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={riskSeverityColors[risk.severity]}>
                          {riskSeverity(risk.severity)}
                        </Badge>
                        <span className="text-sm text-slate-500 capitalize">
                          {risk.category}
                        </span>
                        {risk.requiresAcknowledgement && (
                          <Badge variant="destructive" className="text-xs">
                            {t('change-orders.panels.impact.requiresAck')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{risk.description}</p>
                      {risk.mitigation && (
                        <p className="text-sm text-slate-500 mt-2">
                          <strong>{t('change-orders.panels.impact.mitigationLabel')}</strong> {risk.mitigation}
                        </p>
                      )}
                      {risk.affectedItems && risk.affectedItems.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          <span className="text-xs text-slate-500 mr-1">
                            {t('change-orders.panels.impact.affectedPartsLabel')}
                          </span>
                          {risk.affectedItems
                            .slice(0, 5)
                            .map((itemNum: string) => (
                              <Badge
                                key={itemNum}
                                variant="secondary"
                                className="text-xs font-mono"
                              >
                                {itemNum}
                              </Badge>
                            ))}
                          {risk.affectedItems.length > 5 && (
                            <Badge variant="secondary" className="text-xs">
                              {t('change-orders.panels.impact.moreParts', { count: risk.affectedItems.length - 5 })}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cross-Design Impact */}
      {impactData.crossDesignImpacts &&
        impactData.crossDesignImpacts.length > 0 && (
          <CrossDesignImpactCard impacts={impactData.crossDesignImpacts} />
        )}

      {/* Where-Used Hierarchical View */}
      {impactData.whereUsed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('change-orders.panels.impact.whereUsedTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(whereUsedByDepth)
                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                .map(([depth, nodes]) => (
                  <div key={depth} className="space-y-1">
                    <div className="text-sm font-medium text-slate-500 mb-2">
                      {t('change-orders.panels.impact.levelLabel', { depth, count: nodes.length })}
                    </div>
                    <div className="space-y-1 ml-4">
                      {(expandedLevels.has(parseInt(depth))
                        ? nodes
                        : nodes.slice(0, 10)
                      ).map((node) => {
                        const nodeKey = node.masterId ?? node.itemId
                        const isAdded = addedToChangeOrder.has(nodeKey)
                        const error = addToChangeOrderErrors[nodeKey]
                        return (
                          <div
                            key={nodeKey}
                            className="p-2 text-sm border rounded hover:bg-slate-50 dark:hover:bg-slate-900 space-y-1"
                          >
                            {/* Main line */}
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {node.itemType}
                              </Badge>
                              <span className="font-mono">
                                {node.itemNumber}
                              </span>
                              <span className="text-slate-500">
                                {formatRevision(node.revision)}
                              </span>
                              <span className="flex-1 truncate">
                                {node.name}
                              </span>
                              {node.designCode && (
                                <span className="text-xs text-slate-400 font-mono">
                                  {node.designCode}
                                </span>
                              )}
                              <Badge
                                variant={
                                  node.recommendation === 'revise'
                                    ? 'success'
                                    : 'secondary'
                                }
                              >
                                {node.state}
                              </Badge>
                            </div>
                            {/* Source line: which affected items this parent contains */}
                            {node.sourceAffectedItems &&
                              node.sourceAffectedItems.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-slate-500 ml-1">
                                  <span>{t('change-orders.panels.impact.containsLabel')}</span>
                                  {node.sourceAffectedItems.map((src) => (
                                    <Badge
                                      key={src.affectedItemId}
                                      variant={
                                        changeActionColors[src.changeAction] ??
                                        'secondary'
                                      }
                                      className="text-xs font-mono"
                                    >
                                      {src.itemNumber} ({src.changeAction})
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            {/* Recommendation line for released assemblies */}
                            {node.recommendation === 'revise' && (
                              <div className="flex items-center gap-2 ml-1">
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  {t('change-orders.panels.impact.reviseRecommendation')}
                                </span>
                                {isAdded ? (
                                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                    <Check className="h-3 w-3" />
                                    {t('change-orders.panels.impact.addedToEco')}
                                  </span>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-6 text-xs px-2"
                                    onClick={() => handleAddToChangeOrder(node)}
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {t('change-orders.panels.impact.addToEco')}
                                  </Button>
                                )}
                                {error && (
                                  <span className="text-xs text-red-500">
                                    {error}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {nodes.length > 10 && (
                        <button
                          onClick={() => {
                            setExpandedLevels((prev) => {
                              const next = new Set(prev)
                              const level = parseInt(depth)
                              if (next.has(level)) {
                                next.delete(level)
                              } else {
                                next.add(level)
                              }
                              return next
                            })
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-center py-2 w-full"
                        >
                          {expandedLevels.has(parseInt(depth))
                            ? t('change-orders.panels.impact.showLess')
                            : t('change-orders.panels.impact.moreAtLevel', { count: nodes.length - 10 })}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Related Changes */}
      {impactData.relatedChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                {t('change-orders.panels.impact.conflictingTitle')}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {impactData.relatedChanges.map((change: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <span className="font-medium">{change.itemNumber}</span>
                    <span className="text-sm text-slate-500 ml-2">
                      {t('change-orders.panels.impact.stateLabel', { state: change.state })}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    {t('change-orders.panels.impact.viewAction')}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents */}
      {impactData.documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {t('change-orders.panels.impact.impactedDocsTitle', { count: impactData.documents.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500">
              {t('change-orders.panels.impact.impactedDocsBody', { count: impactData.documents.length })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
