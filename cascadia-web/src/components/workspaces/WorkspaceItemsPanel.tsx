// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { GitBranch, Loader2, X } from 'lucide-react'
import type { WorkspaceItem } from '@/query'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui'
import { apiFetch } from '@/api/client'
import { ItemLink } from '@/components/items/ItemLink'
import { useAlertDialog } from '@/hooks/useAlertDialog'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { useInvalidateResources, workspaceItemsQuery } from '@/query'

interface WorkspaceItemsPanelProps {
  workspaceId: string
  readOnly?: boolean
}

const changeTypeColor: Record<
  string,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  added: 'success',
  modified: 'default',
  deleted: 'destructive',
}

export function WorkspaceItemsPanel({
  workspaceId,
  readOnly = false,
}: WorkspaceItemsPanelProps) {
  const { t } = useTranslation('entities')
  const { confirm } = useAlertDialog()
  const { handleError, showSuccess } = useErrorHandler()
  const invalidate = useInvalidateResources()
  const { data: items = [], isLoading } = useQuery(
    workspaceItemsQuery(workspaceId),
  )

  const removeItem = async (item: WorkspaceItem) => {
    const label = item.itemNumber ?? t('designs.workspaces.items.itemFallback')
    try {
      await apiFetch(
        `/api/v1/workspaces/${workspaceId}/items/${item.itemMasterId}`,
        { method: 'DELETE' },
      )
      showSuccess(t('designs.workspaces.items.removedTitle'), t('designs.workspaces.items.removedBody', { label }))
      await invalidate('workspaces')
    } catch (error) {
      handleError(error, { title: t('designs.workspaces.items.removeFailedTitle') })
    }
  }

  // Removing an item a workspace created destroys the draft itself; removing
  // a modified item discards the workspace's edits. Both deserve a warning —
  // undoing an untouched checkout does not.
  const handleRemove = (item: WorkspaceItem) => {
    const label = item.itemNumber ?? t('designs.workspaces.items.thisItemFallback')
    if (item.changeType === 'added') {
      confirm({
        title: t('designs.workspaces.items.deleteDraftTitle'),
        description: t('designs.workspaces.items.deleteDraftBody', { label }),
        actionLabel: t('designs.workspaces.items.deleteDraftAction'),
        cancelLabel: t('designs.workspaces.items.cancelAction'),
        variant: 'destructive',
        onConfirm: () => removeItem(item),
      })
    } else if (
      item.changeType === 'modified' ||
      item.changeType === 'deleted'
    ) {
      confirm({
        title: t('designs.workspaces.items.discardTitle'),
        description: t('designs.workspaces.items.discardBody', { label }),
        actionLabel: t('designs.workspaces.items.discardAction'),
        cancelLabel: t('designs.workspaces.items.cancelAction'),
        variant: 'destructive',
        onConfirm: () => removeItem(item),
      })
    } else {
      void removeItem(item)
    }
  }

  // Get count statistics
  const totalItems = items.length
  const addedCount = items.filter((i) => i.changeType === 'added').length
  const modifiedCount = items.filter((i) => i.changeType === 'modified').length
  const deletedCount = items.filter((i) => i.changeType === 'deleted').length

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('designs.workspaces.items.title')}
          </h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{totalItems} total</Badge>
            {addedCount > 0 && (
              <Badge variant="success">{addedCount} added</Badge>
            )}
            {modifiedCount > 0 && (
              <Badge variant="default">{modifiedCount} modified</Badge>
            )}
            {deletedCount > 0 && (
              <Badge variant="destructive">{deletedCount} deleted</Badge>
            )}
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {items.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50 text-slate-400" />
              <p className="text-slate-500 dark:text-slate-400">
                {t('designs.workspaces.items.emptyTitle')}
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                {t('designs.workspaces.items.emptyBody')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("designs.workspaces.items.colNumber")}</TableHead>
                  <TableHead>{t("designs.workspaces.items.colName")}</TableHead>
                  <TableHead>{t("designs.workspaces.items.colType")}</TableHead>
                  <TableHead>{t("designs.workspaces.items.colChangeType")}</TableHead>
                  <TableHead>{t("designs.workspaces.items.colState")}</TableHead>
                  <TableHead>{t("designs.workspaces.items.colRev")}</TableHead>
                  {!readOnly && (
                    <TableHead className="text-right">{t("designs.workspaces.items.colActions")}</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.itemId && item.itemType ? (
                        <ItemLink
                          itemType={item.itemType}
                          itemId={item.itemId}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {item.itemNumber}
                        </ItemLink>
                      ) : (
                        (item.itemNumber ?? '-')
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {item.itemName || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.itemType ?? '-'}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.changeType ? (
                        <Badge variant={changeTypeColor[item.changeType]}>
                          {item.changeType}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {t("designs.workspaces.items.checkedOut")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{item.state ?? '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono">
                        {item.revision ?? '-'}
                      </span>
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(item)}
                            title={t('designs.workspaces.items.removeTitle')}
                          >
                            <X className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
