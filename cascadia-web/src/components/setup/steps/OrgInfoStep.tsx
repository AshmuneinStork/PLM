// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { settingQuery } from '@/query'
import { Button, Card, CardContent, Input, Label } from '@/components/ui'

interface OrgInfo {
  name: string
  primaryContact: string
  brandingColor: string
}

const DEFAULT_ORG_INFO: OrgInfo = {
  name: '',
  primaryContact: '',
  brandingColor: '#3b82f6',
}

interface OrgInfoStepProps {
  onCompleted: () => void
}

export function OrgInfoStep({ onCompleted }: OrgInfoStepProps) {
  const { t } = useTranslation('setup')
  const { t: tCommon } = useTranslation('common')
  const [form, setForm] = useState<OrgInfo>(DEFAULT_ORG_INFO)
  const [saving, setSaving] = useState(false)
  const [savedName, setSavedName] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Whatever a previous run of the wizard stored, so re-running shows it.
  const { data: stored } = useQuery(settingQuery<OrgInfo>('org.info'))
  useEffect(() => {
    if (stored) {
      setForm({ ...DEFAULT_ORG_INFO, ...stored })
      setSavedName(stored.name)
    }
  }, [stored])

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError(t('forms.org.nameRequired'))
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/v1/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'org.info',
          jsonValue: form,
          description: 'Organization information set during first-time setup',
        }),
      })
      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json.error?.message ?? t('forms.org.saveFailed'))
      }
      setSavedName(form.name)
      onCompleted()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
{t('steps.org.title')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
{t('steps.org.description')}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="space-y-2">
<Label htmlFor="org-name">{t('forms.org.nameLabel')}</Label>
            <Input
              id="org-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder={t('forms.org.namePlaceholder')}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-contact">
{t('forms.org.contactLabel')}
            </Label>
            <Input
              id="org-contact"
              type="email"
              value={form.primaryContact}
              onChange={(e) =>
                setForm({ ...form, primaryContact: e.target.value })
              }
              placeholder={t('forms.org.contactPlaceholder')}
            />
          </div>
          <div className="space-y-2">
<Label htmlFor="org-color">{t('forms.org.colorLabel')}</Label>
            <div className="flex gap-2 items-center">
              <input
                id="org-color"
                type="color"
                value={form.brandingColor}
                onChange={(e) =>
                  setForm({ ...form, brandingColor: e.target.value })
                }
                className="h-10 w-16 rounded border border-slate-300 dark:border-slate-700 cursor-pointer"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                {form.brandingColor}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving || !form.name.trim()}>
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
{saving ? tCommon('states.saving') : t('forms.org.saveAndContinue')}
            </Button>
            {savedName && !saving && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
{t('forms.org.savedAs', { name: savedName })}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
