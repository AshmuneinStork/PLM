// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Plus, Trash2, User, Users, X } from 'lucide-react'
import type {
  InstanceApprover,
  InstanceState,
} from '@cascadia/commons/lifecycles/types'
import {
  Badge,
  Button,
  Card,
  CardContent,
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
import { apiFetch } from '@/api/client'
import { instanceStateApproversQuery } from '@/query/options/change-orders'
import { activeUserListQuery, roleListQuery } from '@/query/options/users'

interface InstanceStatePropertiesPanelProps {
  state: InstanceState
  isCurrent: boolean
  onUpdate: (state: InstanceState) => void
  onClose: () => void
  readOnly?: boolean
  /** Change order this instance workflow belongs to (for approver APIs) */
  changeOrderId: string
}

const colorOptions = [
  { value: 'gray', label: 'Gray', class: 'bg-slate-400' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-400' },
  { value: 'green', label: 'Green', class: 'bg-green-400' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-400' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-400' },
  { value: 'red', label: 'Red', class: 'bg-red-400' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-400' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-400' },
]

export function InstanceStatePropertiesPanel({
  state,
  isCurrent,
  onUpdate,
  onClose,
  readOnly = false,
  changeOrderId,
}: InstanceStatePropertiesPanelProps) {
  const { t } = useTranslation('entities')
  const handleChange = (updates: Partial<InstanceState>) => {
    onUpdate({ ...state, ...updates })
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{t('change-orders.panels.stateProps.title')}</CardTitle>
            {isCurrent && (
              <Badge variant="default" className="text-xs">
                {t('change-orders.panels.stateProps.current')}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* State ID (readonly) */}
        <div className="space-y-1.5">
          <Label htmlFor="stateId" className="text-xs">
            {t('change-orders.panels.stateProps.stateId')}
          </Label>
          <Input
            id="stateId"
            value={state.id}
            disabled
            className="h-8 text-sm bg-slate-50 dark:bg-slate-900"
          />
        </div>

        {/* State Name */}
        <div className="space-y-1.5">
          <Label htmlFor="stateName" className="text-xs">
            {t('change-orders.panels.stateProps.name')}
          </Label>
          <Input
            id="stateName"
            value={state.name}
            onChange={(e) => handleChange({ name: e.target.value })}
            className="h-8 text-sm"
            placeholder={t('change-orders.panels.stateProps.namePlaceholder')}
            disabled={readOnly || state.isInitial || state.isFinal}
          />
        </div>

        {/* Color */}
        <div className="space-y-1.5">
          <Label className="text-xs">{t('change-orders.panels.stateProps.color')}</Label>
          <Select
            value={state.color || 'gray'}
            onValueChange={(value) => handleChange({ color: value })}
            disabled={readOnly}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorOptions.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${color.class}`} />
                    {color.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5">
          <Label htmlFor="stateInstructions" className="text-xs">
            {t('change-orders.panels.stateProps.instructions')}
          </Label>
          <textarea
            id="stateInstructions"
            value={state.instructions || ''}
            onChange={(e) => handleChange({ instructions: e.target.value })}
            className="w-full h-20 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none disabled:opacity-50"
            placeholder={t('change-orders.panels.stateProps.instructionsPlaceholder')}
            disabled={readOnly}
          />
        </div>

        {/* Final state toggle (only for non-initial states) */}
        {!state.isInitial && !readOnly && (
          <div className="space-y-2">
            <Label className="text-xs">{t('change-orders.panels.stateProps.stateType')}</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={state.isFinal || false}
                  onChange={(e) =>
                    handleChange({
                      isFinal: e.target.checked,
                      finalKind: e.target.checked ? state.finalKind : undefined,
                    })
                  }
                  className="rounded border-slate-300 dark:border-slate-600"
                  disabled={isCurrent}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t('change-orders.panels.stateProps.finalState')}
                </span>
                <span className="text-xs text-slate-500">
                  {t('change-orders.panels.stateProps.finalHint')}
                </span>
              </label>
            </div>
            {state.isFinal && (
              <div className="space-y-1.5">
                <Label className="text-xs">{t('change-orders.panels.stateProps.onCompletion')}</Label>
                <Select
                  value={state.finalKind ?? ''}
                  onValueChange={(value) =>
                    handleChange({
                      finalKind: value as InstanceState['finalKind'],
                    })
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={t('change-orders.panels.stateProps.finalKindPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="release">
                      {t('change-orders.panels.stateProps.releaseAction')}
                    </SelectItem>
                    <SelectItem value="cancel">
                      {t('change-orders.panels.stateProps.cancelAction')}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {!state.finalKind && (
                  <p className="text-xs text-amber-600 dark:text-amber-500">
                    {t('change-orders.panels.stateProps.onCompletionHintPart1')}
                    {t('change-orders.panels.stateProps.onCompletionHintPart2')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instance-level approvers (WI-4.2): enforced by the server —
            every required approver must approve before the workflow can
            leave this state */}
        <InstanceStateApproversSection
          changeOrderId={changeOrderId}
          stateId={state.id}
          readOnly={readOnly}
        />

        {/* Warning if current state */}
        {isCurrent && (
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              {t('change-orders.panels.stateProps.currentStateNote')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InstanceStateApproversSection({
  changeOrderId,
  stateId,
  readOnly,
}: {
  changeOrderId: string
  stateId: string
  readOnly: boolean
}) {
  const { t } = useTranslation('entities')
  const [saving, setSaving] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newApproverType, setNewApproverType] = useState<'user' | 'role'>(
    'user',
  )
  const [newApproverId, setNewApproverId] = useState('')

  const approversUrl = `/api/v1/change-orders/${changeOrderId}/workflow/states/${stateId}/approvers`

  const {
    data: approvers = [],
    isPending: loading,
    refetch: refetchApprovers,
  } = useQuery(
    instanceStateApproversQuery<InstanceApprover>(changeOrderId, stateId),
  )

  // Pickers are only needed when the panel can be edited.
  const { data: users = [] } = useQuery({
    ...activeUserListQuery(),
    enabled: !readOnly,
  })
  const { data: roles = [] } = useQuery({
    ...roleListQuery(),
    enabled: !readOnly,
  })

  const putApprovers = async (
    next: Array<{ type: 'user' | 'role'; id: string; isRequired: boolean }>,
  ) => {
    setSaving(true)
    try {
      await apiFetch(approversUrl, {
        method: 'PUT',
        body: JSON.stringify({ approvers: next }),
      })
      await refetchApprovers()
    } catch (error) {
      console.error('Failed to save instance approvers:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleAdd = async () => {
    if (!newApproverId) return
    await putApprovers([
      ...approvers.map((a) => ({
        type: a.approverType,
        id: a.approverId,
        isRequired: a.isRequired,
      })),
      { type: newApproverType, id: newApproverId, isRequired: true },
    ])
    setShowAddForm(false)
    setNewApproverId('')
  }

  const handleRemove = async (approverId: string) => {
    await putApprovers(
      approvers
        .filter((a) => a.id !== approverId)
        .map((a) => ({
          type: a.approverType,
          id: a.approverId,
          isRequired: a.isRequired,
        })),
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{t('change-orders.panels.stateProps.approvers')}</Label>
        {!readOnly && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="h-6 text-xs"
            disabled={saving}
          >
            <Plus className="h-3 w-3 mr-1" />
            {t('change-orders.panels.stateProps.add')}
          </Button>
        )}
      </div>
      <p className="text-xs text-slate-500">
        {t('change-orders.panels.stateProps.approversHintPart1')}
        state.
      </p>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3 w-3 animate-spin" />
          {t('change-orders.panels.stateProps.loadingApprovers')}
        </div>
      ) : approvers.length === 0 && !showAddForm ? (
        <p className="text-xs text-slate-500 italic">
          {t('change-orders.panels.stateProps.noApprovers')}
        </p>
      ) : (
        <div className="space-y-1">
          {approvers.map((approver) => (
            <div
              key={approver.id}
              className="flex items-center gap-2 p-1.5 rounded-md bg-slate-50 dark:bg-slate-800"
            >
              {approver.approverType === 'role' ? (
                <Users className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              ) : (
                <User className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
              )}
              <span className="flex-1 text-xs truncate">
                {approver.approverName || approver.approverId}
              </span>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemove(approver.id)}
                  className="h-5 w-5 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  disabled={saving}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAddForm && !readOnly && (
        <div className="space-y-1.5 p-2 border rounded-md">
          <Select
            value={newApproverType}
            onValueChange={(value: 'user' | 'role') => {
              setNewApproverType(value)
              setNewApproverId('')
            }}
          >
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">{t('change-orders.panels.stateProps.user')}</SelectItem>
              <SelectItem value="role">{t('change-orders.panels.stateProps.role')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={newApproverId} onValueChange={setNewApproverId}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue
                placeholder={
                  newApproverType === 'user' ? t('change-orders.panels.stateProps.selectUser') : t('change-orders.panels.stateProps.selectRole')
                }
              />
            </SelectTrigger>
            <SelectContent>
              {newApproverType === 'user'
                ? users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))
                : roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            className="h-6 text-xs w-full"
            disabled={saving || !newApproverId}
          >
            {saving ? (
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            ) : (
              <Plus className="h-3 w-3 mr-1" />
            )}
            {t('change-orders.panels.stateProps.addApprover')}
          </Button>
        </div>
      )}
    </div>
  )
}
