// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { GitBranch, Loader2 } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@/components/ui'
import { apiFetch } from '@/api/client'
import { useErrorHandler } from '@/hooks/useErrorHandler'

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  designId: string
  designName?: string
  onSuccess?: (workspaceId: string, workspaceName: string) => void
}

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
  designId,
  designName,
  onSuccess,
}: CreateWorkspaceDialogProps) {
  const { t } = useTranslation('entities')
  const { handleError, showSuccess } = useErrorHandler()
  const [workspaceName, setWorkspaceName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCreate = async () => {
    if (!workspaceName.trim()) {
      handleError(new Error(t('designs.workspaces.create.nameRequired')), {
        title: t('designs.workspaces.create.validationTitle'),
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiFetch<{
        data: { workspaceId: string; branchName: string }
      }>('/api/v1/workspaces', {
        method: 'POST',
        body: JSON.stringify({
          designId,
          workspaceName: workspaceName.trim(),
        }),
      })

      showSuccess(
        t('designs.workspaces.create.createdTitle'),
        t('designs.workspaces.create.createdBody', { name: workspaceName }),
      )

      onOpenChange(false)
      setWorkspaceName('')
      onSuccess?.(response.data.workspaceId, response.data.branchName)
    } catch (error) {
      handleError(error, { title: t('designs.workspaces.create.createFailedTitle') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isSubmitting) {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('designs.workspaces.create.title')}
          </DialogTitle>
          <DialogDescription>
            {t('designs.workspaces.create.description', {
              design: designName || t('designs.workspaces.create.designFallback'),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">{t('designs.workspaces.create.nameLabel')}</Label>
            <Input
              id="workspace-name"
              placeholder={t('designs.workspaces.create.namePlaceholder')}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSubmitting}
              autoFocus
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('designs.workspaces.create.nameHint')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('designs.workspaces.create.cancelAction')}
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!workspaceName.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('designs.workspaces.create.creatingAction')}
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4 mr-2" />
                {t('designs.workspaces.create.createAction')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
