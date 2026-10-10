// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { Link } from '@tanstack/react-router'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Edit, Eye, MoreVertical, Trash2 } from 'lucide-react'
import { TOOL_SUBTYPES } from '@cascadia/commons/items/types/tool'
import type { KnownToolSubtype, Tool } from '@cascadia/commons/items/types/tool'
import type {
  ColumnFiltersState,
  DataGridColumn,
  PaginationState,
  Row,
  SortingState,
} from '@/components/ui'
import { Button, DataGrid } from '@/components/ui'
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
import { useLifecyclePhases } from '@/hooks/useLifecyclePhases'

interface ToolTableProps {
  items: Array<Tool>
  onEdit?: (tool: Tool) => void
  onDelete?: (tool: Tool) => void
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

function subtypeLabel(subtype?: string): string {
  if (!subtype) return ''
  const known = TOOL_SUBTYPES[subtype as KnownToolSubtype] as
    { label: string } | undefined
  return known?.label ?? subtype
}

export function ToolTable({
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
}: ToolTableProps) {
  const { t } = useTranslation('entities')
  // State filter options and badges come from the Tool lifecycle's
  // configuration, not from a list in code
  const { data: lifecycle } = useLifecyclePhases('Tool')
  const stateFilterOptions = (lifecycle?.states ?? []).map((state) => ({
    label: state.name,
    value: state.id,
  }))

  const typeFilterOptions = (
    ['manufacturing', 'quality', 'utility'] as const
  ).map((value) => ({
    label: t(`tools.typeLabels.${value}`),
    value,
  }))

  const columns: Array<DataGridColumn<Tool>> = [
    {
      id: 'itemNumber',
      header: t('tools.table.itemNumber'),
      accessorKey: 'itemNumber',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('tools.table.searchPlaceholder'),
      cell: ({ row }) =>
        row.original.id ? (
          <Link
            to="/tools/$id"
            params={{ id: row.original.id }}
            className="font-mono text-sm text-sky-600 hover:text-sky-800 hover:underline dark:text-sky-400 dark:hover:text-sky-300"
          >
            {row.original.itemNumber}
          </Link>
        ) : (
          <span className="font-mono text-sm">{row.original.itemNumber}</span>
        ),
    },
    {
      id: 'name',
      header: t('tools.table.name'),
      accessorKey: 'name',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('tools.table.filterPlaceholder'),
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      id: 'toolType',
      header: t('tools.table.type'),
      accessorKey: 'toolType',
      enableFiltering: true,
      filterType: 'multiSelect',
      filterOptions: typeFilterOptions,
      cell: ({ getValue }) => {
        const value = getValue() as string | undefined
        if (!value) return '-'
        return <span>{t(`tools.typeLabels.${value}`)}</span>
      },
    },
    {
      id: 'toolSubtype',
      header: t('tools.table.subtype'),
      accessorKey: 'toolSubtype',
      enableFiltering: false,
      cell: ({ getValue }) => (
        <span className="text-slate-500 dark:text-slate-400">
          {subtypeLabel(getValue() as string | undefined)}
        </span>
      ),
    },
    {
      id: 'manufacturer',
      header: t('tools.table.manufacturer'),
      accessorKey: 'manufacturer',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('tools.table.filterPlaceholder'),
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      id: 'model',
      header: t('tools.table.model'),
      accessorKey: 'model',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('tools.table.filterPlaceholder'),
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
    {
      id: 'state',
      header: t('tools.table.state'),
      accessorKey: 'state',
      enableFiltering: true,
      filterType: 'multiSelect',
      filterOptions: stateFilterOptions,
      cell: ({ getValue }) => (
        <StateBadge itemType="Tool" state={getValue() as string} />
      ),
    },
    {
      id: 'location',
      header: t('tools.table.location'),
      accessorKey: 'location',
      enableFiltering: true,
      filterType: 'text',
      filterPlaceholder: t('tools.table.filterPlaceholder'),
      cell: ({ getValue }) => (getValue() as string) || '-',
    },
  ]

  const renderRowActions = (row: Row<Tool>) => {
    const tool = row.original
    const hasActions = tool.id || onEdit || onDelete
    if (!hasActions) return null

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">{t('tools.table.openMenu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {tool.id && (
            <DropdownMenuItem asChild>
              <Link to="/tools/$id" params={{ id: tool.id }}>
                <Eye className="mr-2 h-4 w-4" />
                {t('tools.table.viewDetails')}
              </Link>
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={() => onEdit(tool)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('tools.table.edit')}
            </DropdownMenuItem>
          )}
          {onDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(tool)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('tools.table.del')}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  const renderContextMenuItems = useCallback(
    (row: Row<Tool>) => {
      const tool = row.original
      const hasActions = onEdit || onDelete
      if (!hasActions) return null

      return (
        <>
          {onEdit && (
            <ContextMenuItem onClick={() => onEdit(tool)}>
              <Edit className="mr-2 h-4 w-4" />
              {t('tools.table.edit')}
            </ContextMenuItem>
          )}
          {onDelete && (
            <>
              <ContextMenuSeparator />
              <ContextMenuItem
                onClick={() => onDelete(tool)}
                className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('tools.table.del')}
              </ContextMenuItem>
            </>
          )}
        </>
      )
    },
    [onEdit, onDelete, t],
  )

  const getRowUrl = useCallback((row: Tool) => {
    return row.id ? `/tools/${row.id}` : ''
  }, [])

  return (
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
      emptyMessage={t('tools.table.emptyMessage')}
      emptyDescription={t('tools.table.emptyDescription')}
      exportFilename="tools"
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
  )
}
