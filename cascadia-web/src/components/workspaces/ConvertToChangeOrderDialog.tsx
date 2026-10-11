// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileBox, Loader2 } from 'lucide-react'
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'
import { apiFetch } from '@/api/client'
import { useErrorHandler } from '@/hooks/useErrorHandler'

interface ConvertToChangeOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceId: string
  workspaceName: string
  itemCount: number
  onSuccess?: (changeOrderId: string, changeOrderNumber: string) => void
}

export function ConvertToChangeOrderDialog({
  open,
  onOpenChange,
  workspaceId,
  workspaceName,
  itemCount,
  onSuccess,
}: ConvertToChangeOrderDialogProps) {
  const { t } = useTranslation('entities')
  const { handleError, showSuccess } = useErrorHandler()
  const [changeOrderTitle, setChangeOrderTitle] = useState('')
  const [changeOrderDescription, setChangeOrderDescription] = useState('')
  const [changeType, setChangeType] = useState<
    'ECO' | 'ECN' | 'MCO' | 'Deviation'
  >('ECO')
  const [deleteWorkspace, setDeleteWorkspace] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConvert = async () => {
    if (!changeOrderTitle.trim()) {
      handleError(new Error(t('designs.workspaces.convert.titleRequired')), {
        title: t('designs.workspaces.convert.validationTitle'),
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiFetch<{
        data: {
          ecoId: string
          ecoNumber: string
          itemsConverted: number
          itemsSkipped: number
          workspaceDeleted: boolean
        }
      }>(`/api/v1/workspaces/${workspaceId}/convert-to-change-order`, {
        method: 'POST',
        body: JSON.stringify({
          ecoTitle: changeOrderTitle.trim(),
          ecoDescription: changeOrderDescription.trim(),
          changeType,
          deleteWorkspace,
        }),
      })

      showSuccess(
        t('designs.workspaces.convert.convertedTitle'),
        t('designs.workspaces.convert.convertedBody', {
          number: response.data.ecoNumber,
          converted: response.data.itemsConverted,
        }) +
          (response.data.itemsSkipped > 0
            ? t('designs.workspaces.convert.convertedSkipped', {
                skipped: response.data.itemsSkipped,
              })
            : ''),
      )

      onOpenChange(false)
      setChangeOrderTitle('')
      setChangeOrderDescription('')
      setDeleteWorkspace(false)
      onSuccess?.(response.data.ecoId, response.data.ecoNumber)
    } catch (error) {
      handleError(error, {
        title: t('designs.workspaces.convert.failedTitle'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBox className="h-5 w-5" />
            {t('designs.workspaces.convert.title')}
          </DialogTitle>
          <DialogDescription>
            {t('designs.workspaces.convert.description', {
              workspace: workspaceName,
              count: itemCount,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="eco-title">{t('designs.workspaces.convert.titleLabel')}</Label>
            <Input
              id="eco-title"
              placeholder={t('designs.workspaces.convert.titlePlaceholder')}
              value={changeOrderTitle}
              onChange={(e) => setChangeOrderTitle(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="eco-description">{t('designs.workspaces.convert.descriptionLabel')}</Label>
            <Textarea
              id="eco-description"
              placeholder={t('designs.workspaces.convert.descriptionPlaceholder')}
              value={changeOrderDescription}
              onChange={(e) => setChangeOrderDescription(e.target.value)}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="change-type">{t('designs.workspaces.convert.changeTypeLabel')}</Label>
            <Select
              value={changeType}
              onValueChange={(value) =>
                setChangeType(value as 'ECO' | 'ECN' | 'MCO' | 'Deviation')
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ECO">
                  ECO - Engineering Change Order
                </SelectItem>
                <SelectItem value="ECN">
                  ECN - Engineering Change Notice
                </SelectItem>
                <SelectItem value="MCO">
                  MCO - Manufacturing Change Order
                </SelectItem>
                <SelectItem value="Deviation">Deviation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="delete-workspace"
              checked={deleteWorkspace}
              onCheckedChange={(checked) =>
                setDeleteWorkspace(checked === true)
              }
              disabled={isSubmitting}
            />
            <label
              htmlFor="delete-workspace"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {t('designs.workspaces.convert.deleteAfterLabel')}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {t('designs.workspaces.convert.cancelAction')}
          </Button>
          <Button
            onClick={handleConvert}
            disabled={!changeOrderTitle.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('designs.workspaces.convert.convertingAction')}
              </>
            ) : (
              <>
                <FileBox className="h-4 w-4 mr-2" />
                {t('designs.workspaces.convert.convertAction')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
