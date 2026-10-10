// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import type { Software } from '@cascadia/commons/items/types/software'
import type { ItemFilters } from '@/query'
import { PageContainer } from '@/components/layout'
import { SoftwareTable } from '@/components/software/SoftwareTable'
import { useServerDataGrid } from '@/hooks/useServerDataGrid'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui'
import { useAlertDialog } from '@/hooks/useAlertDialog'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import {
  gridParamsFromSearch,
  itemCountsQuery,
  itemGridQuery,
  itemListQuery,
  lifecycleByItemTypeQuery,
  useInvalidateResources,
} from '@/query'
import { apiFetch } from '@/api/client'
import { LifecycleStateCards } from '@/components/items/LifecycleStateCards'

// Search schema for URL validation (drives useServerDataGrid state sync)
const softwareSearchSchema = z.object({
  search: z.coerce.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  filter_softwareType: z.coerce.string().optional(),
  filter_state: z.coerce.string().optional(),
})

const SOFTWARE_FILTERS: ItemFilters = { itemType: 'Software' }
export const Route = createFileRoute('/software/')({
  validateSearch: softwareSearchSchema,
  component: SoftwareListPage,
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps }) => {
    const grid = gridParamsFromSearch(deps)
    await Promise.all([
      queryClient.ensureQueryData(
        itemListQuery<Software>(SOFTWARE_FILTERS, grid),
      ),
      (async () => {
        const lifecycle = await queryClient.ensureQueryData(
          lifecycleByItemTypeQuery('Software'),
        )
        await queryClient.ensureQueryData(
          itemCountsQuery(
            SOFTWARE_FILTERS,
            lifecycle.states.map((state) => state.id),
          ),
        )
      })(),
    ])
  },
})

function SoftwareListPage() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate()
  const { confirm } = useAlertDialog()
  const { handleError, showSuccess } = useErrorHandler()
  const invalidate = useInvalidateResources()

  const {
    items: softwareItems,
    total,
    dataGridProps,
  } = useServerDataGrid<Software>({
    query: itemGridQuery<Software>(SOFTWARE_FILTERS),
  })

  const handleEdit = (sw: Software) => {
    if (sw.id) {
      navigate({ to: '/software/$id', params: { id: sw.id } })
    }
  }

  const handleDelete = (sw: Software) => {
    if (!sw.id) return

    confirm({
      title: t('software.dialogs.deleteTitle'),
      description: t('software.dialogs.deleteBody', { itemNumber: sw.itemNumber }),
      actionLabel: t('software.dialogs.deleteAction'),
      cancelLabel: t('software.dialogs.cancelAction'),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/v1/software/${sw.id}`, {
            method: 'DELETE',
          })

          showSuccess(t('software.toasts.deletedTitle'), t('software.toasts.deletedBody', { itemNumber: sw.itemNumber }))
          await invalidate('software')
        } catch (error) {
          handleError(error, { title: t('software.toasts.deleteFailedTitle') })
        }
      },
    })
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            {t('software.list.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            {t('software.list.subtitle')}
          </p>
        </div>
        <Link to="/software/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t('software.list.createAction')}
          </Button>
        </Link>
      </div>

      {/* Stats — one card per lifecycle state, from configuration */}
      <LifecycleStateCards
        itemType="Software"
        filters={SOFTWARE_FILTERS}
        total={total}
        totalLabel={t('software.list.totalLabel')}
      />

      {/* Software Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('software.list.cardTitle')}</CardTitle>
          <CardDescription>
            {t('software.list.cardCount', { count: total })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SoftwareTable
            items={softwareItems}
            onEdit={handleEdit}
            onDelete={handleDelete}
            serverSidePagination={dataGridProps.serverSidePagination}
            serverSideOperations={dataGridProps.serverSideOperations}
            totalRows={dataGridProps.totalRows}
            isLoading={dataGridProps.isLoading}
            sorting={dataGridProps.sorting}
            onSortingChange={dataGridProps.onSortingChange}
            columnFilters={dataGridProps.columnFilters}
            onColumnFiltersChange={dataGridProps.onColumnFiltersChange}
            globalFilter={dataGridProps.globalFilter}
            onGlobalFilterChange={dataGridProps.onGlobalFilterChange}
            pagination={dataGridProps.pagination}
            onPaginationChange={dataGridProps.onPaginationChange}
            onPageChange={dataGridProps.onPageChange}
          />
        </CardContent>
      </Card>
    </PageContainer>
  )
}
