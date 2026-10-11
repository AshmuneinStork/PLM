// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronUp, Mail, Plus, Trash2, X } from 'lucide-react'
import type {
  ActionType,
  FieldOperator,
  GuardType,
  LifecycleTransition,
  NotificationRecipient,
  NotificationRecipientType,
  SendNotificationConfig,
  TransitionAction,
  TransitionGuard,
  UpdateFieldConfig,
} from '@cascadia/commons/lifecycles/types'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  LoadingSpinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui'
import { roleListQuery, userListQuery } from '@/query/options/users'

interface TransitionPropertiesPanelProps {
  transition: LifecycleTransition
  kind: 'lifecycle' | 'workflow'
  onUpdate: (transition: LifecycleTransition) => void
  onDelete: (transitionId: string) => void
  onClose: () => void
}

// approval_count is gone: approvals are gated by state approvers, not guards
const guardTypes: Array<{ value: GuardType; labelKey: string }> = [
  { value: 'field_value', labelKey: 'lifecycles.transitionPanel.guardType_field_value' },
  { value: 'user_role', labelKey: 'lifecycles.transitionPanel.guardType_user_role' },
]

const fieldOperators: Array<{ value: FieldOperator; labelKey: string }> = [
  { value: 'equals', labelKey: 'lifecycles.transitionPanel.operator_equals' },
  { value: 'not_equals', labelKey: 'lifecycles.transitionPanel.operator_not_equals' },
  { value: 'contains', labelKey: 'lifecycles.transitionPanel.operator_contains' },
  { value: 'is_empty', labelKey: 'lifecycles.transitionPanel.operator_is_empty' },
  { value: 'is_not_empty', labelKey: 'lifecycles.transitionPanel.operator_is_not_empty' },
  { value: 'greater_than', labelKey: 'lifecycles.transitionPanel.operator_greater_than' },
  { value: 'less_than', labelKey: 'lifecycles.transitionPanel.operator_less_than' },
]

// The transition_driven_item action type is gone: changeActionMappings
// applied at merge are the single mechanism for ECO-driven state change.
// create_task is gone too — it only ever threw NotImplementedError (D5).
const actionTypes: Array<{ value: ActionType; labelKey: string }> = [
  { value: 'send_notification', labelKey: 'lifecycles.transitionPanel.actionType_send_notification' },
  { value: 'update_field', labelKey: 'lifecycles.transitionPanel.actionType_update_field' },
]

export function TransitionPropertiesPanel({
  transition,
  kind,
  onUpdate,
  onDelete,
  onClose,
}: TransitionPropertiesPanelProps) {
  const { t } = useTranslation('entities')
  const [expandedGuards, setExpandedGuards] = useState<Set<string>>(new Set())
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set())
  const isWorkflow = kind === 'workflow'

  // Recipient pickers, only for workflows — actions are a workflow feature.
  const { data: users = [], isFetching: loadingUsers } = useQuery({
    ...userListQuery(),
    enabled: isWorkflow,
  })
  const { data: roles = [], isFetching: loadingRoles } = useQuery({
    ...roleListQuery(),
    enabled: isWorkflow,
  })

  // Helper to update transition and immediately propagate changes
  const handleChange = (updates: Partial<LifecycleTransition>) => {
    onUpdate({ ...transition, ...updates })
  }

  const toggleGuardExpanded = (id: string) => {
    setExpandedGuards((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleActionExpanded = (id: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const addGuard = () => {
    const newGuard: TransitionGuard = {
      id: `guard-${Date.now()}`,
      name: t('lifecycles.transitionPanel.newGuard'),
      type: 'field_value',
      config: { fieldName: '', operator: 'is_not_empty' },
    }
    handleChange({ guards: [...(transition.guards || []), newGuard] })
    setExpandedGuards((prev) => new Set([...prev, newGuard.id]))
  }

  const updateGuard = (index: number, updates: Partial<TransitionGuard>) => {
    const newGuards = transition.guards?.map((g, i) =>
      i === index ? { ...g, ...updates } : g,
    )
    handleChange({ guards: newGuards })
  }

  const removeGuard = (index: number) => {
    handleChange({ guards: transition.guards?.filter((_, i) => i !== index) })
  }

  const addAction = () => {
    const newAction: TransitionAction = {
      id: `action-${Date.now()}`,
      name: t('lifecycles.transitionPanel.newAction'),
      type: 'send_notification',
      executeOn: 'after',
      config: { recipients: [], templateId: 'workflow_transition' },
    }
    handleChange({ actions: [...(transition.actions || []), newAction] })
    setExpandedActions((prev) => new Set([...prev, newAction.id]))
  }

  // Get default config for an action type
  const getDefaultActionConfig = (
    type: ActionType,
  ): SendNotificationConfig | UpdateFieldConfig => {
    switch (type) {
      case 'send_notification':
        return {
          recipients: [],
          templateId: 'workflow_transition',
        } satisfies SendNotificationConfig
      case 'update_field':
        return { fieldName: '', value: '' } satisfies UpdateFieldConfig
    }
  }

  const updateAction = (index: number, updates: Partial<TransitionAction>) => {
    const newActions = transition.actions?.map((a, i) =>
      i === index ? { ...a, ...updates } : a,
    )
    handleChange({ actions: newActions })
  }

  const removeAction = (index: number) => {
    handleChange({ actions: transition.actions?.filter((_, i) => i !== index) })
  }

  return (
    <Card className="w-96 shadow-lg max-h-[80vh] overflow-y-auto">
      <CardHeader className="pb-3 sticky top-0 bg-white dark:bg-slate-900 z-10">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {t('lifecycles.transitionPanel.title')}
          </CardTitle>
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
        {/* Transition Name */}
        <div className="space-y-1.5">
          <Label htmlFor="transitionName" className="text-xs">
            {t('lifecycles.transitionPanel.name')}
          </Label>
          <Input
            id="transitionName"
            value={transition.name}
            onChange={(e) => handleChange({ name: e.target.value })}
            className="h-8 text-sm"
            placeholder={t('lifecycles.transitionPanel.namePlaceholder')}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="transitionDescription" className="text-xs">
            {t('lifecycles.transitionPanel.description')}
          </Label>
          <textarea
            id="transitionDescription"
            value={transition.description || ''}
            onChange={(e) => handleChange({ description: e.target.value })}
            className="w-full h-16 px-3 py-2 text-sm rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 resize-none"
            placeholder={t('lifecycles.transitionPanel.descriptionPlaceholder')}
          />
        </div>

        {/* Required approvals */}
        <div className="space-y-1.5">
          <Label htmlFor="transitionApprovals" className="text-xs">
            {t('lifecycles.transitionPanel.requiredApprovals')}
          </Label>
          <Input
            id="transitionApprovals"
            type="number"
            min={0}
            value={transition.approvalRequirement?.requiredCount ?? 0}
            onChange={(e) => {
              const requiredCount = Math.max(
                0,
                Number.parseInt(e.target.value, 10) || 0,
              )
              handleChange({
                approvalRequirement:
                  requiredCount > 0 ? { requiredCount } : undefined,
              })
            }}
            className="h-8 text-sm"
          />
          <p className="text-xs text-slate-500">
            {t('lifecycles.transitionPanel.requiredApprovalsHint')}
          </p>
        </div>

        {/* Guards Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold">{t('lifecycles.transitionPanel.guards')}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addGuard}
              className="h-6 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              {t('lifecycles.transitionPanel.addGuard')}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            {t('lifecycles.transitionPanel.guardsHint')}
          </p>

          {transition.guards?.map((guard, index) => (
            <div
              key={guard.id}
              className="border rounded-md bg-slate-50 dark:bg-slate-900"
            >
              <button
                type="button"
                onClick={() => toggleGuardExpanded(guard.id)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="text-sm font-medium">{guard.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500">{guard.type}</span>
                  {expandedGuards.has(guard.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </button>

              {expandedGuards.has(guard.id) && (
                <div className="p-2 pt-0 space-y-2 border-t">
                  {/* Guard Name */}
                  <Input
                    value={guard.name}
                    onChange={(e) =>
                      updateGuard(index, { name: e.target.value })
                    }
                    className="h-7 text-xs"
                    placeholder={t('lifecycles.transitionPanel.guardNamePlaceholder')}
                  />

                  {/* Guard Type */}
                  <Select
                    value={guard.type}
                    onValueChange={(value: GuardType) =>
                      updateGuard(index, {
                        type: value,
                        config:
                          value === 'field_value'
                            ? { fieldName: '', operator: 'is_not_empty' }
                            : { requiredRoles: [] },
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {guardTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {t(type.labelKey)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Guard Config based on type */}
                  {guard.type === 'field_value' && (
                    <div className="space-y-2">
                      <Input
                        value={(guard.config as any).fieldName || ''}
                        onChange={(e) =>
                          updateGuard(index, {
                            config: {
                              ...guard.config,
                              fieldName: e.target.value,
                            },
                          })
                        }
                        className="h-7 text-xs"
                        placeholder={t('lifecycles.transitionPanel.fieldNamePlaceholder')}
                      />
                      <Select
                        value={(guard.config as any).operator || 'is_not_empty'}
                        onValueChange={(value: FieldOperator) =>
                          updateGuard(index, {
                            config: { ...guard.config, operator: value },
                          })
                        }
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {fieldOperators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                              {t(op.labelKey)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!['is_empty', 'is_not_empty'].includes(
                        (guard.config as any).operator,
                      ) && (
                        <Input
                          value={(guard.config as any).value || ''}
                          onChange={(e) =>
                            updateGuard(index, {
                              config: {
                                ...guard.config,
                                value: e.target.value,
                              },
                            })
                          }
                          className="h-7 text-xs"
                          placeholder={t('lifecycles.transitionPanel.valuePlaceholder')}
                        />
                      )}
                    </div>
                  )}

                  {guard.type === 'user_role' && (
                    <Input
                      value={((guard.config as any).requiredRoles || []).join(
                        ', ',
                      )}
                      onChange={(e) =>
                        updateGuard(index, {
                          config: {
                            ...guard.config,
                            requiredRoles: e.target.value
                              .split(',')
                              .map((r) => r.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      className="h-7 text-xs"
                      placeholder={t('lifecycles.transitionPanel.rolesPlaceholder')}
                    />
                  )}

                  {/* Error Message */}
                  <Input
                    value={guard.errorMessage || ''}
                    onChange={(e) =>
                      updateGuard(index, { errorMessage: e.target.value })
                    }
                    className="h-7 text-xs"
                    placeholder={t('lifecycles.transitionPanel.errorPlaceholder')}
                  />

                  {/* Remove Guard */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGuard(index)}
                    className="h-6 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    {t('lifecycles.transitionPanel.removeGuard')}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions Section - Only for Workflows */}
        {isWorkflow && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold">{t('lifecycles.transitionPanel.actions')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addAction}
                className="h-6 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                {t('lifecycles.transitionPanel.addAction')}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              {t('lifecycles.transitionPanel.actionsHint')}
            </p>

            {transition.actions?.map((action, index) => (
              <div
                key={action.id}
                className="border rounded-md bg-purple-50 dark:bg-purple-900/20"
              >
                <button
                  type="button"
                  onClick={() => toggleActionExpanded(action.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30"
                >
                  <span className="text-sm font-medium">{action.name}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-purple-600 dark:text-purple-400">
                      {action.executeOn}
                    </span>
                    {expandedActions.has(action.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {expandedActions.has(action.id) && (
                  <div className="p-2 pt-0 space-y-2 border-t">
                    {/* Action Name */}
                    <Input
                      value={action.name}
                      onChange={(e) =>
                        updateAction(index, { name: e.target.value })
                      }
                      className="h-7 text-xs"
                      placeholder={t('lifecycles.transitionPanel.actionNamePlaceholder')}
                    />

                    {/* Action Type */}
                    <Select
                      value={action.type}
                      onValueChange={(value: ActionType) =>
                        updateAction(index, {
                          type: value,
                          config: getDefaultActionConfig(value),
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {actionTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {t(type.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Execute On */}
                    <Select
                      value={action.executeOn}
                      onValueChange={(value: 'before' | 'after') =>
                        updateAction(index, { executeOn: value })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">
                          {t('lifecycles.transitionPanel.executeBefore')}
                        </SelectItem>
                        <SelectItem value="after">{t('lifecycles.transitionPanel.executeAfter')}</SelectItem>
                      </SelectContent>
                    </Select>

                    {/* Send Notification Configuration */}
                    {action.type === 'send_notification' && (
                      <div className="space-y-2 pt-2 border-t border-purple-200 dark:border-purple-800">
                        <div className="flex items-center gap-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                          <Mail className="h-3 w-3" />
                          {t('lifecycles.transitionPanel.notificationTitle')}
                        </div>

                        {/* Template (read-only for now) */}
                        <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded">
                          <span className="font-medium">{t('lifecycles.transitionPanel.templateLabel')}</span>{' '}
                          {t('lifecycles.transitionPanel.templateName')}
                        </div>

                        {/* Recipients */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">
                              {t('lifecycles.transitionPanel.recipients')}
                            </span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const config = (action.config as
                                  SendNotificationConfig | undefined) ?? {
                                  recipients: [],
                                  templateId: 'workflow_transition',
                                }
                                const newRecipient: NotificationRecipient = {
                                  type: 'role',
                                  id: '',
                                }
                                updateAction(index, {
                                  config: {
                                    ...config,
                                    templateId: 'workflow_transition',
                                    recipients: [
                                      ...config.recipients,
                                      newRecipient,
                                    ],
                                  },
                                })
                              }}
                              className="h-5 text-xs px-2"
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              {t('lifecycles.transitionPanel.addRecipient')}
                            </Button>
                          </div>

                          {(
                            (
                              action.config as
                                SendNotificationConfig | undefined
                            )?.recipients ?? []
                          ).length === 0 && (
                            <p className="text-xs text-slate-500 italic">
                              {t('lifecycles.transitionPanel.noRecipients')}
                            </p>
                          )}

                          {(
                            (
                              action.config as
                                SendNotificationConfig | undefined
                            )?.recipients ?? []
                          ).map((recipient, recipientIndex) => (
                            <div
                              key={recipientIndex}
                              className="flex items-center gap-1"
                            >
                              {/* Recipient Type */}
                              <Select
                                value={recipient.type}
                                onValueChange={(
                                  value: NotificationRecipientType,
                                ) => {
                                  const config =
                                    action.config as SendNotificationConfig
                                  const newRecipients = [...config.recipients]
                                  newRecipients[recipientIndex] = {
                                    ...recipient,
                                    type: value,
                                    id: '',
                                  }
                                  updateAction(index, {
                                    config: {
                                      ...config,
                                      recipients: newRecipients,
                                    },
                                  })
                                }}
                              >
                                <SelectTrigger className="h-6 text-xs w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="role">Role</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Recipient ID (User or Role) */}
                              {recipient.type === 'user' ? (
                                <div className="relative flex-1">
                                  <Select
                                    value={recipient.id || ''}
                                    onValueChange={(value) => {
                                      const config =
                                        action.config as SendNotificationConfig
                                      const newRecipients = [
                                        ...config.recipients,
                                      ]
                                      newRecipients[recipientIndex] = {
                                        ...recipient,
                                        id: value,
                                      }
                                      updateAction(index, {
                                        config: {
                                          ...config,
                                          recipients: newRecipients,
                                        },
                                      })
                                    }}
                                  >
                                    <SelectTrigger className="h-6 text-xs">
                                      <SelectValue placeholder={t('lifecycles.transitionPanel.selectUser')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {users.map((user) => (
                                        <SelectItem
                                          key={user.id}
                                          value={user.id}
                                        >
                                          {user.name || user.email}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {loadingUsers && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                      <LoadingSpinner size="sm" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="relative flex-1">
                                  <Select
                                    value={recipient.id || ''}
                                    onValueChange={(value) => {
                                      const config =
                                        action.config as SendNotificationConfig
                                      const newRecipients = [
                                        ...config.recipients,
                                      ]
                                      newRecipients[recipientIndex] = {
                                        ...recipient,
                                        id: value,
                                      }
                                      updateAction(index, {
                                        config: {
                                          ...config,
                                          recipients: newRecipients,
                                        },
                                      })
                                    }}
                                  >
                                    <SelectTrigger className="h-6 text-xs">
                                      <SelectValue placeholder={t('lifecycles.transitionPanel.selectRole')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {roles.map((role) => (
                                        <SelectItem
                                          key={role.id}
                                          value={role.id}
                                        >
                                          {role.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {loadingRoles && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                      <LoadingSpinner size="sm" />
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Remove Recipient */}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const config =
                                    action.config as SendNotificationConfig
                                  const newRecipients =
                                    config.recipients.filter(
                                      (_, i) => i !== recipientIndex,
                                    )
                                  updateAction(index, {
                                    config: {
                                      ...config,
                                      recipients: newRecipients,
                                    },
                                  })
                                }}
                                className="h-6 w-6 p-0 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>

                        <p className="text-xs text-slate-500">
                          {t('lifecycles.transitionPanel.recipientsHint')}
                        </p>
                      </div>
                    )}

                    {/* Remove Action */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAction(index)}
                      className="h-6 text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {t('lifecycles.transitionPanel.removeAction')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Definition-level transitions carry no approval knob: state
            approvers are the mechanism that gates leaving a state.
            (Per-transition approval counts exist only on instance-level
            transitions of flexible workflows, where WI-4.2 enforces them.) */}
        {isWorkflow && (
          <div className="space-y-1">
            <Label className="text-xs font-semibold">{t('lifecycles.transitionPanel.approvalsTitle')}</Label>
            <p className="text-xs text-slate-500">
              {t('lifecycles.transitionPanel.approvalsHint')}
            </p>
          </div>
        )}

        {/* Delete Transition */}
        <div className="pt-2 border-t">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onDelete(transition.id)}
            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            {t('lifecycles.transitionPanel.deleteTransition')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
