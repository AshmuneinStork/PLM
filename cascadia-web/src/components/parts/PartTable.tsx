// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { Link } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Eye, MoreVertical, Trash2 } from 'lucide-react'
import { PartThumbnail } from './PartThumbnail'
import type { Part } from '@cascadia/commons/items/types/part'
import type {
  ColumnFiltersState,
  DataGridColumn,
  PaginationState,
  Row,
  SortingState,
} from '@/components/ui'
import { Badge, Button, DataGrid, TooltipProvider } from '@/components/ui'
import { PhaseBadge } from '@/components/items/PhaseBadge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  ContextMenuItem,
  ContextMenuSeparator,
} from '@/components/ui/ContextMenu'
import { StateBadge } from '@/components/items/StateBadge'
import { formatCurrencyLocale } from '@/i18n/types'
import { useLifecyclePhases } from '@/hooks/useLifecyclePhases'

interface PartTableProps {
  items: Array<Part>
  onEdit?: (part: Part) => void
  onDelete?: (part: Part) => void
  // Initial state from URL (uncontrolled - just sets starting values)
  defaultSorting?: SortingState
  defaultColumnFilters?: ColumnFiltersState
  defaultGlobalFilter?: string
  // Server-side pagination
  serverSidePagination?: boolean
  totalRows?: number
  onPageChange?: (page: number, pageSize: number) => void
  isLoading?: boolean
  // Server-side operations (controlled state)
  serverSideOperations?: boolean
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  globalFilter?: string
  onGlobalFilterChange?: (filter: string) => void
  pagination?: PaginationState
  onPaginationChange?: (pagination: PaginationState) => void
}

export function PartTable({
  items,
  onEdit,
  onDelete,
  defaultSorting,
  defaultColumnFilters,
  defaultGlobalFilter,
  serverSidePagination,
  totalRows,
  onPageChange,
  isLoading,
  serverSideOperations,
  sorting,
  onSortingChange,
  columnFilters,
  onColumnFiltersChange,
  globalFilter,
  onGlobalFilterChange,
  pagination,
  onPaginationChange,
}: PartTableProps) {
  // State filter options and badges come from the Part lifecycle's
  // configuration, not from a list in code
  const { t, i18n } = useTranslation('entities')
  const locale = i18n.resolvedLanguage || i18n.language || 'en'
  const { data: lifecycle } = useLifecyclePhases('Part')
  const stateFilterOptions = (lifecycle?.states ?? []).map((state) => ({
    label: state.name,
    value: state.id,
  }))

  const columns: Array<DataGridColumn<Part>> = [
    {
      id: 'thumbnail',
      header: '',
      enableSorting: false,
      enableFiltering: false,
      meta: { width: '48px' },
      cell: ({ row }) =>
        row.original.id ? (
          <PartThumbnail itemId={row.original.id} size="sm" preview />
        ) : null,
    },
    {
      id: 'itemNumber',
      header: t('parts.columns.itemNumber'),
      accessorKey: 'itemNumber',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('parts.filters.filterPlaceholder'),
      cell: ({ row }) =>
        row.original.id ? (
          <Link
            to="/parts/$id"
            params={{ id: row.original.id }}
            className="font-medium text-sky-600 hover:text-sky-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
          >
            {row.original.itemNumber}
          </Link>
        ) : (
          <span className="font-medium">{row.original.itemNumber}</span>
        ),
    },
    {
      id: 'revision',
      header: t('parts.columns.revision'),
      accessorKey: 'revision',
      enableSorting: true,
      enableFiltering: false, // Revisions are short, filtering not useful
    },
    {
      id: 'name',
      header: t('parts.columns.name'),
      accessorKey: 'name',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('parts.filters.filterPlaceholder'),
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      id: 'configurable',
      header: t('parts.columns.variants'),
      accessorFn: (row) => (row.optionModel ? 'yes' : 'no'),
      enableSorting: true,
      enableFiltering: true,
      filterType: 'select',
      filterOptions: [
        { label: t('parts.filters.configurable'), value: 'yes' },
        { label: t('parts.filters.notConfigurable'), value: 'no' },
      ],
      cell: ({ getValue }) =>
        getValue() === 'yes' ? (
          <Badge
            variant="outline"
            className="text-cyan-700 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700"
          >
            {t('parts.filters.configurableBadge')}
          </Badge>
        ) : null,
    },
    {
      id: 'partType',
      header: t('parts.columns.partType'),
      accessorKey: 'partType',
      enableFiltering: true,
      filterType: 'multiSelect',
      filterOptions: [
        { label: t('parts.typeLabels.manufacture'), value: 'Manufacture' },
        { label: t('parts.typeLabels.purchase'), value: 'Purchase' },
        { label: t('parts.typeLabels.software'), value: 'Software' },
        { label: t('parts.typeLabels.phantom'), value: 'Phantom' },
      ],
      cell: ({ getValue }) => {
        const value = getValue() as
          'Manufacture' | 'Purchase' | 'Software' | 'Phantom' | undefined
        if (!value) return null
        return (
          <Badge
            variant={
              {
                Manufacture: 'default' as const,
                Purchase: 'secondary' as const,
                Software: 'success' as const,
                Phantom: 'outline' as const,
              }[value]
            }
          >
            {t(`parts.typeLabels.${value.toLowerCase()}`)}
          </Badge>
        )
      },
    },
    {
      id: 'material',
      header: t('parts.columns.material'),
      accessorKey: 'material',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('parts.filters.filterPlaceholder'),
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      id: 'state',
      header: t('parts.columns.state'),
      accessorKey: 'state',
      enableFiltering: true,
      filterType: 'multiSelect',
      filterOptions: stateFilterOptions,
      cell: ({ getValue }) => (
        <StateBadge itemType="Part" state={getValue() as string} />
      ),
    },
    {
      id: 'phase',
      header: t('parts.columns.phase'),
      enableSorting: false,
      enableFiltering: false,
      meta: { width: '120px' },
      cell: ({ row }) => (
        <PhaseBadge
          itemType="Part"
          state={row.original.state ?? ''}
          className="text-xs"
        />
      ),
    },
    {
      id: 'cost',
      header: t('parts.columns.cost'),
      accessorKey: 'cost',
      enableFiltering: true,
      filterType: 'range',
      filterPlaceholder: t('parts.filters.anyPlaceholder'),
      meta: { align: 'right' },
      cell: ({ row }) => {
        const cost = row.original.cost
        const currency = row.original.costCurrency || 'USD'
        if (!cost) return '-'
        return formatCurrencyLocale(cost, currency, locale)
      },
    },
    {
      id: 'usageCount',
      header: t('parts.columns.usedIn'),
      accessorKey: 'usageCount',
      enableFiltering: false,
      enableSorting: true,
      meta: { align: 'center' },
      cell: ({ row }) => {
        const count = row.original.usageCount
        if (count === undefined) return null // Not showing usage counts (design-specific view)
        if (count === 0) return <span className="text-slate-400">-</span>
        return (
          <Badge variant="outline" className="text-xs">
            {t('parts.usage.design', { count })}
          </Badge>
        )
      },
    },
  ]

  const renderRowActions = (row: Row<Part>) => {
    const part = row.original
    const hasActions = part.id || onEdit || onDelete
    if (!hasActions) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t('parts.menu.open')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {part.id && (
            <DropdownMenuItem asChild>
              <Link to="/parts/$id" params={{ id: part.id }}>
                <Eye className="mr-2 h-4 w-4" />
                {t('parts.menu.viewDetails')}
              </Link>
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(part)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('parts.menu.edit')}
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(part)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('parts.menu.delete')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Context menu items (Edit, Delete)
  const renderContextMenuItems = useCallback(
    (row: Row<Part>) => {
      const part = row.original
      const hasActions = onEdit || onDelete
      if (!hasActions) return null

      return (
        <>
          {onEdit && (
            <ContextMenuItem onClick={() => onEdit(part)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('parts.menu.edit')}
            </ContextMenuItem>
          )}
          {onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => onDelete(part)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('parts.menu.delete')}
              </ContextMenuItem>
            </>
          )}
        </>
      )
    },
    [onEdit, onDelete, t],
  )

  // Get URL for row (for "Open in new tab")
  const getRowUrl = useCallback((row: Part) => {
    return row.id ? `/parts/${row.id}` : ''
  }, [])

  return (
    // One provider for the whole grid rather than one per cell. The delay keeps
    // previews from firing as the pointer sweeps down the thumbnail column;
    // skipDelayDuration 0 means each row re-arms that delay independently.
    <TooltipProvider delayDuration={400} skipDelayDuration={0}>
      <DataGrid
        data={items}
        columns={columns}
        getRowId={(row) => row.id ?? row.itemNumber ?? ''}
        enableRowActions={true}
        renderRowActions={renderRowActions}
        enableContextMenu
        getRowUrl={getRowUrl}
        renderContextMenuItems={renderContextMenuItems}
        defaultSorting={defaultSorting}
        defaultColumnFilters={defaultColumnFilters}
        defaultGlobalFilter={defaultGlobalFilter}
        emptyMessage={t('parts.table.emptyTitle')}
        emptyDescription={t('parts.table.emptyHint')}
        exportFilename="parts"
        serverSidePagination={serverSidePagination}
        totalRows={totalRows}
        onPageChange={onPageChange}
        isLoading={isLoading}
        // Server-side operations (controlled state)
        serverSideOperations={serverSideOperations}
        sorting={sorting}
        onSortingChange={onSortingChange}
        columnFilters={columnFilters}
        onColumnFiltersChange={onColumnFiltersChange}
        globalFilter={globalFilter}
        onGlobalFilterChange={onGlobalFilterChange}
        pagination={pagination}
        onPaginationChange={onPaginationChange}
      />
    </TooltipProvider>
  )
}
