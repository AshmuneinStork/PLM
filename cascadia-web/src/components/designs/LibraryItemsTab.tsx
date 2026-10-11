// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useTranslation } from 'react-i18next'
import type { VersionContext } from '@/hooks/useVersionContext'
import type { DataGridColumn } from '@/components/ui/DataGrid'
import type { DesignItem, GridParams } from '@/query'
import { useServerDataGrid } from '@/hooks/useServerDataGrid'
import { designItemsGridQuery } from '@/query'
import { Badge } from '@/components/ui'
import { DataGrid } from '@/components/ui/DataGrid'
import { StateBadge } from '@/components/items/StateBadge'
import { ItemLink } from '@/components/items/ItemLink'
import { getItemDetailPath } from '@/items/item-type-ui'

interface LibraryItemsTabProps {
  designId: string
  versionContext: VersionContext
  isHistoricalView: boolean
}

const getTypeBadgeVariant = (itemType: string) => {
  switch (itemType) {
    case 'Part':
      return 'default' as const
    case 'Document':
      return 'secondary' as const
    case 'Requirement':
      return 'outline' as const
    default:
      return 'default' as const
  }
}

function useLibraryColumns(): Array<DataGridColumn<DesignItem>> {
  const { t } = useTranslation('entities')
  return [
  {
    id: 'itemNumber',
    header: t('designs.library.colNumber'),
    accessorKey: 'itemNumber',
    enableFiltering: true,
    filterType: 'text',
    filterPlaceholder: t('designs.library.filterPlaceholder'),
    cell: ({ row }) => (
      <ItemLink
        itemType={row.original.itemType}
        itemId={row.original.id}
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
      >
        {row.original.itemNumber}
      </ItemLink>
    ),
  },
  {
    id: 'itemType',
    header: t('designs.library.colType'),
    accessorKey: 'itemType',
    enableFiltering: true,
    filterType: 'multiSelect',
    filterOptions: [
      { label: 'Part', value: 'Part' },
      { label: 'Document', value: 'Document' },
      { label: 'Requirement', value: 'Requirement' },
    ],
    cell: ({ getValue }) => (
      <Badge
        variant={getTypeBadgeVariant(getValue() as string)}
        className="text-xs"
      >
        {getValue() as string}
      </Badge>
    ),
  },
  {
    id: 'name',
    header: t('designs.library.colName'),
    accessorKey: 'name',
    enableFiltering: true,
    filterType: 'text',
    filterPlaceholder: t('designs.library.filterPlaceholder'),
  },
  {
    id: 'revision',
    header: t('designs.library.colRevision'),
    accessorKey: 'revision',
    meta: { align: 'center' },
  },
  {
    id: 'state',
    header: t('designs.library.colState'),
    accessorKey: 'state',
    enableFiltering: true,
    // Library items span item types, each with its own lifecycle — a free
    // text filter rather than one type's state list
    filterType: 'text',
    filterPlaceholder: t('designs.library.filterStatePlaceholder'),
    cell: ({ row, getValue }) => (
      <StateBadge
        itemType={row.original.itemType}
        state={getValue() as string}
        className="text-xs"
      />
    ),
  },
  {
    id: 'modifiedAt',
    header: t('designs.library.colModified'),
    accessorKey: 'modifiedAt',
    cell: ({ getValue }) => {
      const val = getValue() as string
      return (
        <span className="text-slate-700 dark:text-slate-300">
          {val ? new Date(val).toLocaleDateString() : '-'}
        </span>
      )
    },
  },
  ]
}

export function LibraryItemsTab({
  designId,
  versionContext,
  isHistoricalView,
}: LibraryItemsTabProps) {
  const { t } = useTranslation('entities')
  const columns = useLibraryColumns()
  const { items, dataGridProps } = useServerDataGrid<DesignItem>({
    query: (grid: GridParams) =>
      designItemsGridQuery(designId, grid, {
        branch: versionContext.branchId,
        tag: versionContext.tagId,
        commit: versionContext.commitId,
      }),
  })

  return (
    <DataGrid
      data={items}
      columns={columns}
      getRowId={(row) => row.id}
      getRowUrl={(row) => getItemDetailPath(row.itemType, row.id) ?? undefined}
      emptyMessage={
        isHistoricalView
          ? t('designs.library.emptyHistorical')
          : t('designs.library.emptyDefault')
      }
      emptyDescription={t("designs.library.emptyHint")}
      exportFilename="library-items"
      defaultSorting={[{ id: 'itemNumber', desc: false }]}
      {...dataGridProps}
    />
  )
}
