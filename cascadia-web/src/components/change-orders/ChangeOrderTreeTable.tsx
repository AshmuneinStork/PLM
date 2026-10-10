// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useTranslation } from 'react-i18next'
import { Check, ExternalLink, Minus, Plus } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { formatRevision } from '@cascadia/commons/types/lifecycle'
import type { BOMTreeNode } from '@/components/bom/types'
import type { ColumnDefinition } from '@/components/bom/BomTreeView'
import { Badge } from '@/components/ui'
import { BomTreeView } from '@/components/bom/BomTreeView'
import { getItemDetailPath } from '@/items/item-type-ui'
import { StateBadge } from '@/components/items/StateBadge'
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/ContextMenu'
import { useLifecyclePhases } from '@/hooks/useLifecyclePhases'

export type { BOMTreeNode }

interface ChangeOrderTreeTableProps {
  nodes: Array<BOMTreeNode>
  expandedNodes: Set<string>
  onToggle: (itemId: string) => void
  onAddToChangeOrder: (node: BOMTreeNode) => void
  onAddChild?: (node: BOMTreeNode) => void
  readOnly?: boolean
  branchId?: string

  // Selection props (optional)
  showCheckboxes?: boolean
  selectedIds?: Set<string>
  onSelectionClick?: (
    itemId: string,
    event: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
  ) => void
  onCheckboxChange?: (itemId: string) => void
  isItemSelectable?: (node: BOMTreeNode) => boolean
  onSelectAll?: () => void
  isAllSelected?: boolean
  isIndeterminate?: boolean

  // Column filter props (optional)
  columnFilters?: Record<string, unknown>
  onColumnFilterChange?: (columnId: string, value: unknown) => void
}

// Get change action badge variant and label
function getChangeActionDisplay(
  action: string | null | undefined,
  isInEco: boolean | undefined,
  t: (key: string) => string,
) {
  if (!isInEco) {
    return { variant: 'outline' as const, label: '—', icon: null }
  }

  switch (action) {
    case 'release':
      return {
        variant: 'success' as const,
        label: t('change-orders.panels.actions.release'),
        icon: <Check className="h-3 w-3" />,
      }
    case 'revise':
      return {
        variant: 'default' as const,
        label: t('change-orders.panels.actions.revise'),
        icon: <Check className="h-3 w-3" />,
      }
    case 'obsolete':
      return {
        variant: 'destructive' as const,
        label: t('change-orders.panels.actions.obsolete'),
        icon: <Minus className="h-3 w-3" />,
      }
    case 'promote':
      return {
        variant: 'warning' as const,
        label: t('change-orders.panels.actions.promote'),
        icon: <Check className="h-3 w-3" />,
      }
    default:
      return {
        variant: 'success' as const,
        label: t('change-orders.panels.actions.inChangeOrder'),
        icon: <Check className="h-3 w-3" />,
      }
  }
}

export function ChangeOrderTreeTable({
  nodes,
  expandedNodes,
  onToggle,
  onAddToChangeOrder: onAddToChangeOrder,
  onAddChild,
  readOnly = false,
  branchId,
  showCheckboxes,
  selectedIds,
  onSelectionClick,
  onCheckboxChange,
  isItemSelectable,
  onSelectAll,
  isAllSelected,
  isIndeterminate,
  columnFilters,
  onColumnFilterChange,
}: ChangeOrderTreeTableProps) {
  const { t } = useTranslation('entities')
  // Lifecycles of the item types in this tree, for the final-state check on
  // the add-to-ECO action. Parts dominate; other types resolve through the
  // same per-type cache on demand.
  const { data: partLifecycle } = useLifecyclePhases('Part')
  const lifecycleByType: Record<
    string,
    { states: Array<{ id: string; isFinal?: boolean }> } | null
  > = { Part: partLifecycle }

  const navigate = useNavigate()

  const columns: Array<ColumnDefinition> = [
    {
      id: 'item',
      label: t('change-orders.panels.treeTable.colItem'),
      width: 'flex-[2] min-w-[200px]',
      filterType: 'text',
      filterPlaceholder: t('change-orders.panels.treeTable.filterItem'),
      renderCell: (node) => (
        <>
          <span className="font-medium text-slate-900 dark:text-white truncate">
            {node.itemNumber}
          </span>
          {node.isExternal && node.designCode && (
            <Badge
              variant="outline"
              className="text-xs text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-600 flex-shrink-0"
              title={t('change-orders.panels.treeTable.externalTitle', { name: node.designName || node.designCode })}
            >
              {node.designCode}
            </Badge>
          )}
          {node.quantity && node.quantity > 1 && (
            <span className="text-xs text-slate-400 flex-shrink-0">
              x{node.quantity}
            </span>
          )}
        </>
      ),
    },
    {
      id: 'name',
      label: t('change-orders.panels.treeTable.colName'),
      width: 'flex-[2] min-w-[150px]',
      filterType: 'text',
      filterPlaceholder: t('change-orders.panels.treeTable.filterName'),
      renderCell: (node) => (
        <span className="truncate text-slate-600 dark:text-slate-400">
          {node.name}
        </span>
      ),
    },
    {
      id: 'rev',
      label: t('change-orders.panels.treeTable.colRev'),
      width: 'w-16 flex-shrink-0',
      align: 'center',
      filterType: 'text',
      filterPlaceholder: t('change-orders.panels.treeTable.filterRev'),
      renderCell: (node) => (
        <span className="text-xs text-slate-500">
          {formatRevision(node.revision)}
        </span>
      ),
    },
    {
      id: 'state',
      label: t('change-orders.panels.treeTable.colState'),
      width: 'w-24 flex-shrink-0',
      align: 'center',
      // The tree spans item types, each with its own lifecycle: a free text
      // filter rather than one type's state list
      filterType: 'text',
      renderCell: (node) => (
        <StateBadge
          itemType={node.itemType}
          state={node.state}
          className="text-xs"
        />
      ),
    },
    {
      id: 'action',
      label: t('change-orders.panels.treeTable.colAction'),
      width: 'w-28 flex-shrink-0',
      align: 'center',
      filterType: 'multiSelect',
      filterOptions: [
        { label: t('change-orders.panels.actions.release'), value: 'release' },
        { label: t('change-orders.panels.actions.revise'), value: 'revise' },
        { label: t('change-orders.panels.actions.obsolete'), value: 'obsolete' },
        { label: t('change-orders.panels.actions.inChangeOrder'), value: '__in_eco__' },
        { label: t('change-orders.panels.actions.notInChangeOrder'), value: '__not_in_eco__' },
      ],
      renderCell: (node) => {
        const actionDisplay = getChangeActionDisplay(
          node.changeAction,
          node.isInEco,
          t,
        )
        if (node.isInEco) {
          return (
            <Badge variant={actionDisplay.variant} className="text-xs gap-1">
              {actionDisplay.icon}
              {actionDisplay.label}
            </Badge>
          )
        }
        return <span className="text-slate-400 text-xs">—</span>
      },
    },
  ]

  const renderContextMenu = (node: BOMTreeNode) => {
    const route = getItemDetailPath(node.itemType, node.itemId)
    // An item whose flow has ended (a final state of its lifecycle —
    // obsolete, superseded, whatever it is called) is not added to an ECO
    const nodeLifecycle = lifecycleByType[node.itemType]
    const nodeStateIsFinal =
      nodeLifecycle?.states.find((st) => st.id === node.state)?.isFinal ?? false
    const isEligibleForAdd = !node.isInEco && !nodeStateIsFinal
    const showAddChild =
      !readOnly && onAddChild && node.itemType === 'Part' && !node.isExternal
    const showAddToChangeOrder = !readOnly && isEligibleForAdd

    return (
      <>
        {route && (
          <ContextMenuItem
            onClick={() =>
              navigate({
                to: route,
                search: branchId ? { branch: branchId } : {},
              } as any)
            }
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            {t('change-orders.panels.treeTable.viewAction')}
          </ContextMenuItem>
        )}
        {(showAddChild || showAddToChangeOrder) && <ContextMenuSeparator />}
        {showAddChild && (
          <ContextMenuItem onClick={() => onAddChild(node)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('change-orders.panels.treeTable.addChild')}
          </ContextMenuItem>
        )}
        {showAddToChangeOrder && (
          <ContextMenuItem onClick={() => onAddToChangeOrder(node)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t('change-orders.panels.treeTable.addToEco')}
          </ContextMenuItem>
        )}
      </>
    )
  }

  return (
    <BomTreeView
      nodes={nodes}
      expandedNodes={expandedNodes}
      onToggle={onToggle}
      layout="grid"
      columns={columns}
      renderContextMenu={renderContextMenu}
      readOnly={readOnly}
      showCheckboxes={showCheckboxes}
      selectedIds={selectedIds}
      onSelectionClick={onSelectionClick}
      onCheckboxChange={onCheckboxChange}
      isItemSelectable={isItemSelectable}
      onSelectAll={onSelectAll}
      isAllSelected={isAllSelected}
      isIndeterminate={isIndeterminate}
      columnFilters={columnFilters}
      onColumnFilterChange={onColumnFilterChange}
    />
  )
}
