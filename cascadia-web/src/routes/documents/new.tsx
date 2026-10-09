// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import type { Document } from '@cascadia/commons/items/types/document'
import { DocumentDetail } from '@/components/documents/DocumentDetail'
import { useErrorHandler } from '@/hooks/useErrorHandler'
import { designListQuery, useInvalidateResources } from '@/query'
import { apiFetch } from '@/api/client'

const newDocumentSearchSchema = z.object({
  designId: z.string().uuid().optional(),
})

export const Route = createFileRoute('/documents/new')({
  validateSearch: newDocumentSearchSchema,
  component: NewDocumentPage,
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(designListQuery()),
})

function NewDocumentPage() {
  const { t } = useTranslation('entities')
  const navigate = useNavigate()
  const { handleError, showSuccess } = useErrorHandler()
  const invalidate = useInvalidateResources()
  const { data: designs = [] } = useQuery(designListQuery())
  const searchParams = Route.useSearch()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSave = async (document: Document, branchId?: string) => {
    setIsSubmitting(true)
    try {
      const payload = {
        ...document,
        itemType: 'Document',
        ...(branchId && { branchId }),
      }
      const result = await apiFetch<{ data: { item: Document } }>(
        '/api/v1/items',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
      )

      showSuccess(
        t('documents.toasts.createdTitle'),
        t('documents.toasts.createdBody', {
          itemNumber: document.itemNumber,
        }),
      )

      await invalidate('documents')

      navigate({ to: '/documents/$id', params: { id: result.data.item.id! } })
    } catch (error) {
      handleError(error, { title: t('documents.toasts.createFailedTitle') })
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    navigate({ to: '/documents' })
  }

  return (
    <DocumentDetail
      designs={designs}
      defaultDesignId={searchParams.designId}
      onSave={handleSave}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
    />
  )
}
