// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  TestTube,
} from 'lucide-react'
import {
  AI_PROVIDERS,
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_BASE_URL,
  PROVIDER_LABELS,
} from '@cascadia/commons/ai/model-catalog'
import { useTranslation } from 'react-i18next'
import { useAiSettings } from '../hooks/useAiSettings'
import type { AiSettingsForm } from '../hooks/useAiSettings'
import type { AiProviderType } from '@cascadia/commons/ai/model-catalog'
import {
  Button,
  Card,
  CardContent,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@/components/ui'
import { useAiModels, withSelectedModel } from '@/hooks/useAiModels'

interface AiKeysStepProps {
  onCompleted: () => void
}

export function AiKeysStep({ onCompleted }: AiKeysStepProps) {
  const { t } = useTranslation('setup')
  const [form, setForm] = useState<AiSettingsForm>({
    enabled: true,
    provider: 'anthropic',
    apiKey: '',
    model: DEFAULT_MODEL.anthropic,
    baseURL: '',
  })

  const aiSettings = useAiSettings()

  // Nothing is saved yet at this point in setup, so discovery runs off the key
  // the user has just typed and falls back to the built-in list until then.
  const models = useAiModels({
    provider: form.provider,
    apiKey: form.apiKey,
    baseURL: form.baseURL,
  })
  const modelOptions = withSelectedModel(models.options, form.model)

  const handleProviderChange = (provider: AiProviderType) => {
    setForm({
      ...form,
      provider,
      model: DEFAULT_MODEL[provider],
      baseURL: provider === 'ollama' ? DEFAULT_OLLAMA_BASE_URL : '',
    })
    aiSettings.reset()
  }

  const handleSaveAndContinue = async () => {
    const ok = await aiSettings.save(form)
    if (ok) onCompleted()
  }

  const canTest = form.apiKey.length > 0 || form.provider === 'ollama'
  const canSave = form.apiKey.length > 0 || form.provider === 'ollama'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        <div>
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">
{t('steps.ai.title')}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
{t('steps.ai.description')}
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
<Label htmlFor="ai-provider">{t('forms.ai.providerLabel')}</Label>
              <Select
                value={form.provider}
                onValueChange={(v) => handleProviderChange(v as AiProviderType)}
              >
                <SelectTrigger id="ai-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AI_PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROVIDER_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
<Label htmlFor="ai-model">{t('forms.ai.modelLabel')}</Label>
              <div className="flex items-center gap-2">
                <Select
                  value={form.model}
                  onValueChange={(v) => setForm({ ...form, model: v })}
                >
                  <SelectTrigger id="ai-model" className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {modelOptions.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label === m.id ? m.id : `${m.label} — ${m.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={models.refresh}
                  disabled={models.isFetching}
                  title="Refresh model list from provider"
                  aria-label="Refresh model list from provider"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${models.isFetching ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
              {!models.isLive && models.fallbackReason && (
                <p className="text-xs text-slate-500">
                  {models.fallbackReason}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai-key">
{t('forms.ai.apiKeyLabel')}{' '}
              {form.provider === 'ollama' && (
<span className="text-xs text-slate-500">{t('forms.ai.apiKeyNotRequired')}</span>
              )}
            </Label>
            <Input
              id="ai-key"
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
              placeholder={form.provider === 'ollama' ? '—' : 'sk-…'}
              disabled={form.provider === 'ollama'}
            />
          </div>

          {form.provider === 'ollama' && (
            <div className="space-y-2">
<Label htmlFor="ai-baseurl">{t('forms.ai.baseUrlLabel')}</Label>
              <Input
                id="ai-baseurl"
                value={form.baseURL ?? ''}
                onChange={(e) => setForm({ ...form, baseURL: e.target.value })}
                placeholder={t('forms.ai.baseUrlPlaceholder')}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              id="ai-enabled"
              checked={form.enabled}
              onCheckedChange={(checked) =>
                setForm({ ...form, enabled: checked })
              }
            />
<Label htmlFor="ai-enabled">{t('forms.ai.enableLabel')}</Label>
          </div>

          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <Button
              variant="outline"
              onClick={() => aiSettings.testConnection(form)}
              disabled={!canTest || aiSettings.testing}
            >
              {aiSettings.testing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4 mr-2" />
              )}
{t('forms.ai.testConnection')}
            </Button>
            <Button
              onClick={handleSaveAndContinue}
              disabled={!canSave || aiSettings.saving}
            >
              {aiSettings.saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
{t('forms.ai.saveAndContinue')}
            </Button>

            {aiSettings.testStatus === 'success' && (
              <span className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
{aiSettings.testMessage || t('forms.ai.connected')}
              </span>
            )}
            {aiSettings.testStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                {aiSettings.testMessage}
              </span>
            )}
            {aiSettings.saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                {aiSettings.saveMessage}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
