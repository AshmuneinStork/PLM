// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  Ban,
  Check,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react'
import type { VersionContext } from '@/hooks/useVersionContext'
import { Button, Card, CardContent } from '@/components/ui'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { designChangeOrdersQuery } from '@/query'
import { StateBadge } from '@/components/items/StateBadge'
import { useLifecyclePhases } from '@/hooks/useLifecyclePhases'

interface ChangeOrdersTabProps {
  designId: string
  versionContext: VersionContext
  isHistoricalView: boolean
  onCreateChangeOrder?: () => void
}

export function ChangeOrdersTab({
  designId,
  isHistoricalView,
  onCreateChangeOrder: onCreateChangeOrder,
}: ChangeOrdersTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { t } = useTranslation('entities')

  const {
    data: changeOrders = [],
    isPending: loading,
    error: loadError,
  } = useQuery(designChangeOrdersQuery(designId))
  const error = loadError ? t('designs.changeOrders.loadFailed') : null

  // Filter ECOs by status
  const filteredChangeOrders = useMemo(() => {
    if (statusFilter === 'all') return changeOrders
    return changeOrders.filter(
      (changeOrder) => changeOrder.state === statusFilter,
    )
  }, [changeOrders, statusFilter])

  // Every change-order state renders from the CO workflow's own definition:
  // the badge takes the configured name and colour (StateBadge), and the
  // icon keys on the state's flags — never on what it is called.
  const { data: coLifecycle } = useLifecyclePhases('ChangeOrder')
  const stateFlags = (state: string) =>
    coLifecycle?.states.find((st) => st.id === state || st.name === state)

  const getStatusIcon = (state: string) => {
    const flags = stateFlags(state)
    if (flags?.isFinal) {
      if (flags.finalKind === 'release') {
        return <Check className="h-4 w-4 text-green-500" />
      }
      return <Ban className="h-4 w-4 text-slate-400" />
    }
    if (flags?.isInitial) {
      return <RefreshCw className="h-4 w-4 text-slate-400" />
    }
    return <Search className="h-4 w-4 text-amber-500" />
  }

  // Get time since
  const getTimeSince = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return t('designs.changeOrders.today')
    if (diffDays === 1) return t('designs.changeOrders.yesterday')
    if (diffDays < 7) return t('designs.changeOrders.daysAgo', { count: diffDays })
    if (diffDays < 30) return t('designs.changeOrders.weeksAgo', { count: Math.floor(diffDays / 7) })
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{t("designs.changeOrders.statusLabel")}</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('designs.changeOrders.allStatuses')}</SelectItem>
              {(coLifecycle?.states ?? []).map((state) => (
                <SelectItem key={state.id} value={state.id}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onCreateChangeOrder && (
          <Button onClick={onCreateChangeOrder} disabled={isHistoricalView}>
            <Plus className="h-4 w-4 mr-2" />
            {t('designs.changeOrders.createAction')}
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
          <CardContent className="py-4">
            <p className="text-amber-700 dark:text-amber-300">{error}</p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              {t('designs.changeOrders.loadHint')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ECO Cards */}
      {filteredChangeOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredChangeOrders.map((changeOrder) => (
            <Card
              key={changeOrder.id}
              className="hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className="mt-1 p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      {getStatusIcon(changeOrder.state)}
                    </div>

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg text-slate-900 dark:text-white">
                          {changeOrder.itemNumber}
                        </span>
                        <StateBadge
                          itemType="ChangeOrder"
                          state={changeOrder.state}
                        />
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 mt-1">
                        {changeOrder.reasonForChange ||
                          changeOrder.name ||
                          t('designs.changeOrders.noDescription')}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                        <span>{t('designs.changeOrders.items', { count: changeOrder.itemCount })}</span>
                        <span>{changeOrder.owner.name}</span>
                        <span>
                          {changeOrder.releasedAt
                            ? t('designs.changeOrders.releasedAgo', { when: getTimeSince(changeOrder.releasedAt) })
                            : t('designs.changeOrders.startedAgo', { when: getTimeSince(changeOrder.createdAt) })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {}
                  <Link to={`/change-orders/${changeOrder.id}` as any}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      {t('designs.changeOrders.viewAction')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !error && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-slate-500 dark:text-slate-400">
                {changeOrders.length === 0
                  ? t('designs.changeOrders.emptyDesign')
                  : t('designs.changeOrders.emptyFiltered')}
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  )
}
