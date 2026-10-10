// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC


import type { TFunction } from 'i18next'

const REL_KEY: Record<string, string> = {
  bom_where_used: 'change-orders.panels.impact.relBomWhereUsed',
  definition_instance: 'change-orders.panels.impact.relDefinitionInstance',
  definition_source: 'change-orders.panels.impact.relDefinitionSource',
  usage_cousin: 'change-orders.panels.impact.relUsageCousin',
  cross_design_ref: 'change-orders.panels.impact.relCrossDesignRef',
}

const RISK_SEV_KEY: Record<string, string> = {
  low: 'change-orders.panels.impact.riskLow',
  medium: 'change-orders.panels.impact.riskMedium',
  high: 'change-orders.panels.impact.riskHigh',
  critical: 'change-orders.panels.impact.riskCritical',
}

const ACTION_KEY: Record<string, string> = {
  release: 'change-orders.panels.actions.release',
  revise: 'change-orders.panels.actions.revise',
  obsolete: 'change-orders.panels.actions.obsolete',
  add: 'change-orders.panels.actions.add',
  remove: 'change-orders.panels.actions.remove',
}

export function getImpactI18nHelpers(t: TFunction<'entities'>) {
  const relLabel = (type: string): string =>
    t(REL_KEY[type] ?? type, { defaultValue: type })
  const riskSeverity = (sev: string): string =>
    t(RISK_SEV_KEY[sev] ?? sev, { defaultValue: sev })
  const actionLabel = (action: string): string =>
    t(ACTION_KEY[action] ?? action, { defaultValue: action })
  return { relLabel, riskSeverity, actionLabel }
}

export function formatCrossDesignSummaryI18n(
  t: TFunction<'entities'>,
  impact: {
    summary: Record<string, number>
    relationshipSummary?: Record<string, number>
  },
): string {
  const { relLabel } = getImpactI18nHelpers(t)
  // Lowercase only the first letter: keeps acronyms (BOM) intact in both locales.
  const lowerFirst = (s: string): string =>
    s.length > 1 ? s.charAt(0).toLowerCase() + s.slice(1) : s.toLowerCase()
  const joinList = (items: Array<string>): string => {
    if (items.length <= 1) return items[0] ?? ''
    return t('change-orders.panels.impact.listJoin', {
      first: items.slice(0, -1).join(', '),
      last: items.at(-1),
    })
  }
  if (
    impact.relationshipSummary &&
    Object.keys(impact.relationshipSummary).length > 0
  ) {
    const parts = Object.entries(impact.relationshipSummary).map(
      ([type, count]) =>
        t('change-orders.panels.impact.viaLabel', {
          count,
          type: lowerFirst(relLabel(type)),
        }),
    )
    if (parts.length <= 1)
      return t('change-orders.panels.impact.impactedBySingle', {
        part: parts[0] ?? '',
      })
    return t('change-orders.panels.impact.impactedByList', {
      parts: parts.slice(0, -1).join(', '),
      last: parts.at(-1),
    })
  }
  const actionKey: Record<string, string> = {
    revise: 'change-orders.panels.impact.partBeingRevised',
    release: 'change-orders.panels.impact.partBeingReleased',
    obsolete: 'change-orders.panels.impact.partBeingObsoleted',
    add: 'change-orders.panels.impact.partBeingAdded',
    remove: 'change-orders.panels.impact.partBeingRemoved',
  }
  const parts = Object.entries(impact.summary).map(([action, count]) =>
    actionKey[action]
      ? t(actionKey[action], { count })
      : `${count} ${action}`,
  )
  return joinList(parts)
}
