// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Copy, Loader2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Checkbox } from '@/components/ui/Checkbox'
import { Progress } from '@/components/ui/Progress'
import { apiFetch } from '@/api/client'
import { jobStatusQuery } from '@/query'

interface CloneDesignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sourceDesignId: string
  sourceDesignCode: string
  sourceDesignName: string
}

type CloneStatus = 'idle' | 'submitting' | 'cloning' | 'completed' | 'failed'

interface CloneResult {
  designId: string
  designCode: string
  itemsCloned: number
  relationshipsCloned: number
  derivedFromCreated: number
  filesReferenced: number
}

export function CloneDesignDialog({
  open,
  onOpenChange,
  sourceDesignId,
  sourceDesignCode,
  sourceDesignName,
}: CloneDesignDialogProps) {
  const { t } = useTranslation('entities')
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<
    'idle' | 'submitting' | 'cloning' | 'failed'
  >('idle')
  const [jobId, setJobId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [suffixItemNumbers, setSuffixItemNumbers] = useState(false)

  // The clone runs on a worker, so the dialog watches the job it started.
  // `refetchInterval` returning false at a terminal status is what used to be
  // a `setInterval` plus a `clearInterval` in three branches.
  const { data: job } = useQuery({
    ...jobStatusQuery<CloneResult>(jobId, phase === 'cloning'),
    refetchInterval: (query) => {
      const jobStatus = query.state.data?.status
      return jobStatus === 'completed' || jobStatus === 'failed' ? false : 1000
    },
  })

  const status: CloneStatus =
    job?.status === 'completed'
      ? 'completed'
      : job?.status === 'failed'
        ? 'failed'
        : phase
  const progress = job?.progress ?? 0
  const progressMessage = job?.progressMessage ?? ''
  const result = job?.result ?? null
  const error =
    submitError ??
    (job?.status === 'failed'
      ? (job.error ?? t('designs.clone.fallbackError'))
      : null)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setCode(
        `${sourceDesignCode}${t('designs.clone.defaultCodeSuffix')}`,
      )
      setName(
        `${sourceDesignName}${t('designs.clone.defaultNameSuffix')}`,
      )
      setDescription('')
      setPhase('idle')
      setJobId(null)
      setSubmitError(null)
      setSuffixItemNumbers(false)
    }
  }, [open, sourceDesignCode, sourceDesignName, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPhase('submitting')
    setSubmitError(null)

    try {
      const response = await apiFetch(
        `/api/v1/designs/${sourceDesignId}/clone`,
        {
          method: 'POST',
          body: JSON.stringify({
            code: code.toUpperCase(),
            name,
            description: description || undefined,
            suffixItemNumbers: suffixItemNumbers || undefined,
          }),
        },
      )

      const { data } = response as { data: { jobId: string } }
      setJobId(data.jobId)
      setPhase('cloning')
    } catch (err) {
      setPhase('failed')
      setSubmitError((err as Error).message || t('designs.clone.startFailedFallback'))
    }
  }

  // Back to the form. The failed job has to be let go of as well, or the
  // derived status would keep reporting its failure.
  const handleTryAgain = () => {
    setPhase('idle')
    setJobId(null)
    setSubmitError(null)
  }

  const handleNavigateToNewDesign = () => {
    if (result?.designId) {
      onOpenChange(false)
      navigate({ to: '/designs/$id', params: { id: result.designId } })
    }
  }

  const handleClose = () => {
    if (status === 'cloning') {
      // Don't close while cloning is in progress
      return
    }
    onOpenChange(false)
  }

  const isFormDisabled = status !== 'idle'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            {t('designs.clone.title')}
          </DialogTitle>
          <DialogDescription>
            {t('designs.clone.descBody', { code: sourceDesignCode })}
          </DialogDescription>
        </DialogHeader>

        {status === 'idle' || status === 'submitting' ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t('designs.clone.codeLabel')}</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder={t('designs.clone.codePlaceholder')}
                  required
                  disabled={isFormDisabled}
                  pattern="[A-Z0-9\-]+"
                  title={t('designs.clone.codeTitle')}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('designs.clone.codeHint')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t('designs.clone.nameLabel')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('designs.clone.namePlaceholder')}
                  required
                  disabled={isFormDisabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('designs.clone.descriptionLabel')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('designs.clone.descriptionPlaceholder')}
                  rows={3}
                  disabled={isFormDisabled}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suffixItemNumbers"
                  checked={suffixItemNumbers}
                  onCheckedChange={(checked) =>
                    setSuffixItemNumbers(checked as boolean)
                  }
                  disabled={isFormDisabled}
                />
                <Label
                  htmlFor="suffixItemNumbers"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t('designs.clone.suffixLabel')}
                </Label>
              </div>
              {suffixItemNumbers && code && (
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-6">
                  {t('designs.clone.suffixExample', { code })}
                </p>
              )}

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 p-3 rounded-lg">
                  <XCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={status === 'submitting'}
              >
                {t('designs.clone.cancelAction')}
              </Button>
              <Button type="submit" disabled={status === 'submitting'}>
                {status === 'submitting' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('designs.clone.submittingAction')}
                  </>
                ) : (
                  t('designs.clone.submitAction')
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : status === 'cloning' ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {t('designs.clone.cloningTitle')}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {progressMessage || t('designs.clone.waitingFallback')}
              </p>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              {progress}%
            </p>
          </div>
        ) : status === 'completed' && result ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg text-slate-900 dark:text-slate-100">
                {t('designs.clone.completeTitle')}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {t('designs.clone.completeBody')}{' '}
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {result.designCode}
                </span>
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('designs.clone.statsItems')}
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {result.itemsCloned}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('designs.clone.statsRelationships')}
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {result.relationshipsCloned}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('designs.clone.statsTraceability')}
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {result.derivedFromCreated}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  {t('designs.clone.statsFiles')}
                </span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {result.filesReferenced}
                </span>
              </div>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button onClick={handleNavigateToNewDesign}>
                {t('designs.clone.goToAction')}
              </Button>
            </DialogFooter>
          </div>
        ) : status === 'failed' ? (
          <div className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <XCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center">
              <p className="font-medium text-lg text-slate-900 dark:text-slate-100">
                {t('designs.clone.failedTitle')}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                {error}
              </p>
            </div>
            <DialogFooter className="sm:justify-center">
              <Button variant="outline" onClick={handleTryAgain}>
                {t('designs.clone.tryAgainAction')}
              </Button>
              <Button onClick={handleClose}>{t('designs.clone.closeAction')}</Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
