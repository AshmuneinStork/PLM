// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ArrowLeft, FileBox, GitBranch, GitMerge, Trash2 } from 'lucide-react'
import { z } from 'zod'
import { PageContainer } from '@/components/layout'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { useAlertDialog } from '@/hooks/useAlertDialog'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { formatDateTime } from '@/format-date'
import {
  useInvalidateResources,
  workspaceCommitsQuery,
  workspaceDetailQuery,
} from '@/query'
import { apiFetch } from '@/api/client'
import { ConvertToChangeOrderDialog } from '@/components/workspaces/ConvertToChangeOrderDialog'
import { MergeToChangeOrderDialog } from '@/components/workspaces/MergeToChangeOrderDialog'
import { WorkspaceItemsPanel } from '@/components/workspaces/WorkspaceItemsPanel'

/** The tabs the workspace page renders; the search schema derives from this list. */
const WORKSPACE_DETAIL_TABS = ['overview', 'items', 'commits'] as const
type WorkspaceDetailTab = (typeof WORKSPACE_DETAIL_TABS)[number]

// Search schema for tab state
const workspaceDetailSearchSchema = z.object({
  tab: z.enum(WORKSPACE_DETAIL_TABS).optional().default('overview'),
})

export const Route = createFileRoute('/designs/workspaces/$id')({
  component: WorkspaceDetailPage,
  validateSearch: workspaceDetailSearchSchema,
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.ensureQueryData(workspaceDetailQuery(params.id)),
      queryClient.ensureQueryData(workspaceCommitsQuery(params.id)),
    ])
  },
})

function WorkspaceDetailPage() {
  const { t } = useTranslation('entities')
  const { id } = Route.useParams()
  const router = useRouter()
  const { confirm } = useAlertDialog()
  const { handleError, showSuccess } = useErrorHandler()
  const invalidate = useInvalidateResources()
  const [convertToChangeOrderDialogOpen, setConvertToChangeOrderDialogOpen] =
    useState(false)
  const [mergeToChangeOrderDialogOpen, setMergeToChangeOrderDialogOpen] =
    useState(false)

  const { data: workspace } = useQuery(workspaceDetailQuery(id))
  const { data: commits = [], isLoading: loadingCommits } = useQuery(
    workspaceCommitsQuery(id),
  )

  // Tab state from URL
  const search = Route.useSearch()
  const activeTab = search.tab

  const handleTabChange = (tab: WorkspaceDetailTab) => {
    router.navigate({
      to: '/designs/workspaces/$id',
      params: { id },
      search: { tab },
      replace: true,
    })
  }

  if (!workspace) return null

  const displayName = workspace.name.replace('workspace/', '')

  const handleDelete = () => {
    // Only items created on the workspace die with it — checkouts revert
    const draftCount = workspace.workspaceOnlyItemCount

    let description = t('designs.workspaces.deleteBodyShort', { name: displayName })
    if (draftCount > 0) {
      description += `\n\n${t('designs.workspaces.draftWarning', { count: draftCount })}`
    }
    description += `\n\n${t('designs.workspaces.cannotUndo')}`

    confirm({
      title: t('designs.workspaces.deleteTitle'),
      description,
      actionLabel:
        draftCount > 0
          ? t('designs.workspaces.deleteWithItems', { count: draftCount })
          : t('designs.workspaces.deleteAction'),
      cancelLabel: t('designs.workspaces.cancelAction'),
      variant: 'destructive',
      onConfirm: async () => {
        try {
          await apiFetch(`/api/v1/workspaces/${id}`, {
            method: 'DELETE',
          })

          showSuccess(
            t('designs.workspaces.deletedTitle'),
            t('designs.workspaces.deletedBody', { name: displayName }),
          )
          await invalidate('workspaces')
          router.navigate({ to: '/designs/workspaces' })
        } catch (error) {
          handleError(error, { title: t('designs.workspaces.deleteFailedTitle') })
        }
      },
    })
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/designs/workspaces">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <GitBranch className="h-8 w-8 text-cyan-500" />
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                {displayName}
              </h1>
              <Badge variant="secondary" className="text-base">
                {t('designs.workspaceDetail.typeBadge')}
              </Badge>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {t('designs.workspaceDetail.description', {
                design: workspace.designName,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="default"
            onClick={() => setConvertToChangeOrderDialogOpen(true)}
            disabled={workspace.itemCount === 0}
          >
            <FileBox className="h-4 w-4 mr-2" />
            {t('designs.workspaceDetail.convertAction')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setMergeToChangeOrderDialogOpen(true)}
            disabled={workspace.itemCount === 0}
          >
            <GitMerge className="h-4 w-4 mr-2" />
            {t('designs.workspaceDetail.mergeAction')}
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t('designs.workspaceDetail.deleteAction')}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => handleTabChange(value as WorkspaceDetailTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">{t('designs.workspaceDetail.overviewTab')}</TabsTrigger>
          <TabsTrigger value="items">{t('designs.workspaceDetail.itemsTab')}</TabsTrigger>
          <TabsTrigger value="commits">
            {t('designs.workspaceDetail.commitsTab', { count: commits.length })}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('designs.workspaceDetail.overviewTitle')}</CardTitle>
              <CardDescription>
                {t('designs.workspaceDetail.overviewDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('designs.workspaceDetail.nameLabel')}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                    {displayName}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('designs.workspaceDetail.designLabel')}
                  </dt>
                  <dd className="mt-1">
                    <Link
                      to="/designs/$id"
                      params={{ id: workspace.designId }}
                      className="text-lg text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {workspace.designCode || workspace.designName}
                    </Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('designs.workspaceDetail.itemsLabel')}
                  </dt>
                  <dd className="mt-1 text-lg text-slate-900 dark:text-white">
                    {t('designs.workspaceDetail.itemsCount', {
                      count: workspace.itemCount,
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('designs.workspaceDetail.createdLabel')}
                  </dt>
                  <dd className="mt-1 text-lg text-slate-900 dark:text-white">
                    {formatDate(workspace.createdAt)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('designs.workspaceDetail.actionsTitle')}</CardTitle>
              <CardDescription>{t('designs.workspaceDetail.actionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <FileBox className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                      {t('designs.workspaceDetail.convertCardTitle')}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {t('designs.workspaceDetail.convertCardBody')}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setConvertToChangeOrderDialogOpen(true)}
                      disabled={workspace.itemCount === 0}
                    >
                      <FileBox className="h-4 w-4 mr-2" />
                      {t('designs.workspaceDetail.convertAction')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-slate-300 dark:border-slate-700 rounded-lg">
                <div className="flex items-start gap-3">
                  <GitMerge className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-1">
                      {t('designs.workspaceDetail.mergeCardTitle')}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                      {t('designs.workspaceDetail.mergeCardBody')}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMergeToChangeOrderDialogOpen(true)}
                      disabled={workspace.itemCount === 0}
                    >
                      <GitMerge className="h-4 w-4 mr-2" />
                      {t('designs.workspaceDetail.mergeAction')}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="mt-6">
          <WorkspaceItemsPanel workspaceId={workspace.id} />
        </TabsContent>

        {/* Commits Tab */}
        <TabsContent value="commits" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('designs.workspaceDetail.commitsTitle')}</CardTitle>
              <CardDescription>
                {t('designs.workspaceDetail.commitsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCommits ? (
                <div className="text-center py-8 text-slate-500">
                  {t('designs.workspaceDetail.commitsLoading')}
                </div>
              ) : commits.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50 text-slate-400" />
                  <p className="text-slate-500 dark:text-slate-400">
                    {t('designs.workspaceDetail.commitsEmptyTitle')}
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
                    {t('designs.workspaceDetail.commitsEmptyBody')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commits.map((commit) => (
                    <div
                      key={commit.id}
                      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700"
                    >
                      <div className="font-medium text-slate-900 dark:text-white">
                        {commit.message || t('designs.workspaceDetail.commitsNoMessage')}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {formatDateTime(
                          commit.createdAt instanceof Date
                            ? commit.createdAt.toISOString()
                            : commit.createdAt,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <ConvertToChangeOrderDialog
        open={convertToChangeOrderDialogOpen}
        onOpenChange={setConvertToChangeOrderDialogOpen}
        workspaceId={workspace.id}
        workspaceName={displayName}
        itemCount={workspace.itemCount}
        onSuccess={(changeOrderId, changeOrderNumber) => {
          showSuccess(
            t('designs.workspaceDetail.convertSuccessTitle'),
            t('designs.workspaceDetail.convertSuccessBody', {
              number: changeOrderNumber,
            }),
          )
          void invalidate('workspaces', 'change-orders')
          router.navigate({
            to: '/change-orders/$id',
            params: { id: changeOrderId },
          })
        }}
      />

      <MergeToChangeOrderDialog
        open={mergeToChangeOrderDialogOpen}
        onOpenChange={setMergeToChangeOrderDialogOpen}
        workspaceId={workspace.id}
        workspaceName={displayName}
        designId={workspace.designId}
        itemCount={workspace.itemCount}
        onSuccess={(changeOrderId) => {
          showSuccess(
            t('designs.workspaceDetail.mergeSuccessTitle'),
            t('designs.workspaceDetail.mergeSuccessBody'),
          )
          void invalidate('workspaces', 'change-orders')
          router.navigate({
            to: '/change-orders/$id',
            params: { id: changeOrderId },
          })
        }}
      />
    </PageContainer>
  )
}
