// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  CheckCircle,
  Database,
  FileText,
  Loader2,
  Package,
  Plus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { designListQuery, programListQuery } from '@/query'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'

interface CreatedProgram {
  id: string
  name: string
  code: string
}

interface CreatedDesign {
  id: string
  name: string
  code: string
}

interface ProgramsStepProps {
  onCompleted: () => void
}

/**
 * Pull a usable message out of an API error response.
 *
 * `apiHandler` reports a Zod failure as a bare "Validation failed" and puts the
 * offending fields in `fieldErrors`, so the message on its own tells the user
 * nothing about what to correct. Fold the field errors back into the text.
 */
async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const json = (await response.json().catch(() => ({}))) as {
    error?: {
      message?: string
      fieldErrors?: Array<{ field?: string; message?: string }>
    }
  }
  const message = json.error?.message ?? fallback
  const detail = (json.error?.fieldErrors ?? [])
    .map((f) => [f.field, f.message].filter(Boolean).join(': '))
    .filter(Boolean)
    .join(', ')
  return detail ? `${message} — ${detail}` : message
}

export function ProgramsStep({ onCompleted }: ProgramsStepProps) {
  const { t } = useTranslation('setup')
  const [createdPrograms, setCreatedPrograms] = useState<Array<CreatedProgram>>(
    [],
  )
  const [createdDesigns, setCreatedDesigns] = useState<Array<CreatedDesign>>([])

  // Program form
  const [programForm, setProgramForm] = useState({ name: '', code: '' })
  const [savingProgram, setSavingProgram] = useState(false)
  const [programError, setProgramError] = useState('')

  // Design form
  const [designForm, setDesignForm] = useState({
    name: '',
    code: '',
    programId: '',
    designType: 'Engineering' as 'Engineering' | 'Library' | 'Family',
  })
  const [savingDesign, setSavingDesign] = useState(false)
  const [designError, setDesignError] = useState('')

  // Part form
  const [partForm, setPartForm] = useState({
    name: '',
    partType: 'Manufacture' as
      'Manufacture' | 'Purchase' | 'Phantom' | 'Software',
    designId: '',
  })
  const [savingPart, setSavingPart] = useState(false)
  const [partError, setPartError] = useState('')
  const [createdParts, setCreatedParts] = useState<
    Array<{ id: string; name: string }>
  >([])

  // Catalog seed
  const [seedingCatalog, setSeedingCatalog] = useState(false)
  const [catalogResult, setCatalogResult] = useState<{
    inserted: number
    skipped: number
    prunedCategories: number
  } | null>(null)
  const [catalogError, setCatalogError] = useState('')

  // What already exists, so re-running the wizard shows it. Both lists are
  // the same cache entries the rest of the app reads.
  const { data: fetchedPrograms = [] } = useQuery(programListQuery())
  const { data: fetchedDesigns = [] } =
    useQuery(designListQuery<CreatedDesign>())

  // What the server has, plus anything created in this session that the
  // list may not have picked up yet — deduped by id.
  const byId = <T extends { id: string }>(rows: Array<T>, extra: Array<T>) => {
    const seen = new Set(rows.map((r) => r.id))
    return [...rows, ...extra.filter((r) => !seen.has(r.id))]
  }
  const programs = byId(
    fetchedPrograms as unknown as Array<CreatedProgram>,
    createdPrograms,
  )
  const designs = byId(fetchedDesigns, createdDesigns)

  const handleCreateProgram = async () => {
    if (!programForm.name.trim() || !programForm.code.trim()) {
      setProgramError(t('forms.programs.requiredNameCode'))
      return
    }
    setSavingProgram(true)
    setProgramError('')
    try {
      const response = await fetch('/api/v1/programs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: programForm.name.trim(),
          code: programForm.code.trim().toUpperCase(),
        }),
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t('forms.programs.createFailed')),
        )
      }
      const json = await response.json()
      const created = (json.data?.program ?? json.data) as CreatedProgram
      setCreatedPrograms((prev) => [...prev, created])
      setProgramForm({ name: '', code: '' })
      // Pre-select the new program for the design form.
      setDesignForm((d) => ({ ...d, programId: created.id }))
    } catch (err) {
      setProgramError((err as Error).message)
    } finally {
      setSavingProgram(false)
    }
  }

  const handleCreateDesign = async () => {
    if (!designForm.name.trim() || !designForm.code.trim()) {
      setDesignError(t('forms.programs.requiredNameCode'))
      return
    }
    setSavingDesign(true)
    setDesignError('')
    try {
      const response = await fetch('/api/v1/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: designForm.name.trim(),
          code: designForm.code.trim().toUpperCase(),
          programId: designForm.programId || undefined,
          designType: designForm.designType,
        }),
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t('forms.programs.createFailed')),
        )
      }
      const json = await response.json()
      const created = (json.data?.design ?? json.data) as CreatedDesign
      setCreatedDesigns((prev) => [...prev, created])
      setDesignForm({ ...designForm, name: '', code: '' })
      setPartForm((p) => ({ ...p, designId: created.id }))
    } catch (err) {
      setDesignError((err as Error).message)
    } finally {
      setSavingDesign(false)
    }
  }

  const handleCreatePart = async () => {
    if (!partForm.name.trim()) {
      setPartError('Part name is required')
      return
    }
    if (!partForm.designId) {
      setPartError('Pick a design')
      return
    }
    setSavingPart(true)
    setPartError('')
    try {
      const response = await fetch('/api/v1/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: 'Part',
          name: partForm.name.trim(),
          partType: partForm.partType,
          designId: partForm.designId,
        }),
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, t('forms.programs.createFailed')),
        )
      }
      const json = await response.json()
      const created = (json.data?.item ?? json.data) as {
        id: string
        name: string
      }
      setCreatedParts((prev) => [...prev, created])
      setPartForm({ ...partForm, name: '' })
    } catch (err) {
      setPartError((err as Error).message)
    } finally {
      setSavingPart(false)
    }
  }

  const handleSeedCatalog = async () => {
    setSeedingCatalog(true)
    setCatalogError('')
    try {
      const response = await fetch('/api/v1/setup/seed-catalog', {
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error(
          await readErrorMessage(response, 'Failed to load sample catalog'),
        )
      }
      const json = await response.json()
      setCatalogResult(
        (json.data ?? {
          inserted: 0,
          skipped: 0,
          prunedCategories: 0,
        }) as {
          inserted: number
          skipped: number
          prunedCategories: number
        },
      )
    } catch (err) {
      setCatalogError((err as Error).message)
    } finally {
      setSeedingCatalog(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
            {t('steps.programs.title')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {t('steps.programs.description')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('forms.legacy.legacyProgramTitle')}</CardTitle>
            <CardDescription>{t('forms.legacy.legacyProgramExample')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="prog-name">{t('forms.legacy.legacyName')}</Label>
              <Input
                id="prog-name"
                value={programForm.name}
                onChange={(e) =>
                  setProgramForm({ ...programForm, name: e.target.value })
                }
                placeholder={t('forms.legacy.legacyNamePh')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="prog-code">{t('forms.legacy.legacyCode')}</Label>
              <Input
                id="prog-code"
                value={programForm.code}
                onChange={(e) =>
                  setProgramForm({ ...programForm, code: e.target.value })
                }
                placeholder={t('forms.legacy.legacyCodePh')}
                className="font-mono"
              />
            </div>
            {programError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {programError}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateProgram}
              disabled={savingProgram}
              className="w-full"
            >
              {savingProgram ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t('forms.legacy.legacyCreateProgram')}
            </Button>
            {programs.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {programs.length} program{programs.length > 1 ? 's' : ''} total
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('forms.legacy.legacyDesignTitle')}</CardTitle>
            <CardDescription>{t('forms.legacy.legacyDesignDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="des-name">{t('forms.legacy.legacyDesignName')}</Label>
              <Input
                id="des-name"
                value={designForm.name}
                onChange={(e) =>
                  setDesignForm({ ...designForm, name: e.target.value })
                }
                placeholder={t('forms.legacy.legacyDesignNamePh')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="des-code">{t('forms.legacy.legacyDesignCode')}</Label>
              <Input
                id="des-code"
                value={designForm.code}
                onChange={(e) =>
                  setDesignForm({ ...designForm, code: e.target.value })
                }
                placeholder={t('forms.legacy.legacyDesignCodePh')}
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="des-program">{t('forms.legacy.legacyDesignProgram')}</Label>
              <Select
                value={designForm.programId || 'none'}
                onValueChange={(v) =>
                  setDesignForm({
                    ...designForm,
                    programId: v === 'none' ? '' : v,
                  })
                }
              >
                <SelectTrigger id="des-program">
                  <SelectValue placeholder={t('forms.legacy.legacyDesignNone')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t('forms.legacy.legacyDesignNoProgram')}</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {designError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {designError}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateDesign}
              disabled={savingDesign}
              className="w-full"
            >
              {savingDesign ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t('forms.legacy.legacyCreateDesign')}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('forms.legacy.legacyPartTitle')}</CardTitle>
            <CardDescription>{t('forms.legacy.legacyPartDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="part-name">{t('forms.legacy.legacyPartName')}</Label>
              <Input
                id="part-name"
                value={partForm.name}
                onChange={(e) =>
                  setPartForm({ ...partForm, name: e.target.value })
                }
                placeholder={t('forms.legacy.legacyPartNamePh')}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="part-type">{t('forms.legacy.legacyPartType')}</Label>
              <Select
                value={partForm.partType}
                onValueChange={(v) =>
                  setPartForm({
                    ...partForm,
                    partType: v as typeof partForm.partType,
                  })
                }
              >
                <SelectTrigger id="part-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manufacture">Manufacture</SelectItem>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Phantom">Phantom</SelectItem>
                  <SelectItem value="Software">Software</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="part-design">{t('forms.legacy.legacyPartDesign')}</Label>
              <Select
                value={partForm.designId}
                onValueChange={(v) => setPartForm({ ...partForm, designId: v })}
              >
                <SelectTrigger id="part-design">
                  <SelectValue placeholder={t('forms.legacy.legacyPartDesignPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {designs.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {partError && (
              <p className="text-xs text-red-600 dark:text-red-400">
                {partError}
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreatePart}
              disabled={savingPart}
              className="w-full"
            >
              {savingPart ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {t('forms.programs.addPart')}
            </Button>
            {createdParts.length > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('forms.programs.partsCreated', { count: createdParts.length })}
                </p>
                )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <CardTitle>{t('forms.programs.sampleTitle')}</CardTitle>
          </div>
          <CardDescription>
            {t('forms.programs.sampleDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              onClick={handleSeedCatalog}
              disabled={seedingCatalog}
            >
              {seedingCatalog ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Package className="w-4 h-4 mr-2" />
              )}
              {t('forms.programs.loadCatalog')}
            </Button>
            {catalogResult && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                {catalogResult.inserted} entries added, {catalogResult.skipped}{' '}
                skipped
              </span>
            )}
            {catalogError && (
              <span className="text-sm text-red-600 dark:text-red-400">
                {catalogError}
              </span>
            )}
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>
              For larger datasets, you can bulk-import parts from a CSV at{' '}
              <a
                href="/api/import/parts"
                className="text-blue-600 dark:text-blue-400 underline"
              >
                /api/import/parts
              </a>{' '}
              once setup is finished.
            </span>
          </div>
        </CardContent>
      </Card>

      <div>
        <Button onClick={onCompleted}>{t('forms.programs.continue')}</Button>
      </div>
    </div>
  )
}
