// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (c) 2026 Cascadia PLM LLC

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { GitBranch, Lock, Plus, Unlock } from 'lucide-react'
import { BRANCH_TYPES } from '@cascadia/commons/versioning/branch-types'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Badge, Button, FormField, Input } from '@/components/ui'
import { apiFetch } from '@/api/client'
import { useInvalidateResources } from '@/query'
import { designBranchesQuery } from '@/query/options/designs'
import { designStatusQuery } from '@/query/options/branches'

interface Branch {
  id: string
  name: string
  branchType: 'main' | 'eco' | 'workspace' | 'release'
  isLocked: boolean
  isArchived: boolean
  ownerId?: string
}

interface BranchSelectorProps {
  designId: string
  value?: string
  onChange: (branchId: string) => void
  /**
   * Whether to show the main branch option.
   * If main is protected, it will be disabled.
   */
  showMainOption?: boolean
  disabled?: boolean
  className?: string
  /**
   * Placeholder text when no branch is selected
   */
  placeholder?: string
  /**
   * Callback when user wants to create a new ECO
   */
  onCreateChangeOrder?: () => void
}

/**
 * Dropdown to select a branch for item creation/editing.
 * Shows different branch types grouped: Main, ECO branches, Workspace branches
 */
export function BranchSelector({
  designId,
  value,
  onChange,
  showMainOption = true,
  disabled = false,
  className,
  placeholder,
  onCreateChangeOrder: onCreateChangeOrder,
}: BranchSelectorProps) {
  const { t } = useTranslation('entities')
  const resolvedPlaceholder = placeholder ?? t('parts.form.selectBranch')
  const invalidate = useInvalidateResources()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const { data: branches = [], isLoading: loadingBranches } = useQuery({
    ...designBranchesQuery<Branch>(designId),
    enabled: Boolean(designId),
  })
  const { data: status, isLoading: loadingStatus } = useQuery(
    designStatusQuery(designId),
  )

  const loading = loadingBranches || loadingStatus
  const isProtected = status?.protection.isMainBranchProtected ?? false

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      setCreateError(t('parts.form.workspaceNameRequired'))
      return
    }

    setCreating(true)
    setCreateError(null)
    try {
      const result = await apiFetch<{ data: { branch: Branch } }>(
        `/api/v1/designs/${designId}/branches`,
        {
          method: 'POST',
          body: JSON.stringify({
            branchType: 'workspace',
            name: newWorkspaceName.trim(),
          }),
        },
      )
      await invalidate('workspaces')
      onChange(result.data.branch.id)
      setShowCreateDialog(false)
      setNewWorkspaceName('')
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : t('parts.form.failedLoadBranches'),
      )
    } finally {
      setCreating(false)
    }
  }

  const handleValueChange = (val: string) => {
    if (val === '__create_workspace__') {
      setShowCreateDialog(true)
      return
    }
    if (val === '__create_eco__') {
      onCreateChangeOrder?.()
      return
    }
    onChange(val)
  }

  // Group branches by type
  const mainBranch = branches.find((b) => b.branchType === 'main')
  const changeOrderBranches = branches.filter(
    (b) => b.branchType === BRANCH_TYPES.changeOrder && !b.isArchived,
  )
  const workspaceBranches = branches.filter(
    (b) => b.branchType === 'workspace' && !b.isArchived,
  )

  // Get selected branch for display
  const selectedBranch = branches.find((b) => b.id === value)

  if (loading) {
    return (
      <div className="h-9 w-48 animate-pulse bg-slate-200 dark:bg-slate-700 rounded-md" />
    )
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${className ?? ''}`}>
        <Select
          value={value}
          onValueChange={handleValueChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-56">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-slate-500" />
              <SelectValue placeholder={resolvedPlaceholder}>
                {selectedBranch && (
                  <span className="flex items-center gap-2">
                    {selectedBranch.branchType === 'main' &&
                      (isProtected ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Unlock className="h-3 w-3" />
                      ))}
                    {selectedBranch.name}
                  </span>
                )}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent>
            {/* Main branch */}
            {showMainOption && mainBranch && (
              <SelectGroup>
                <SelectLabel>{t('parts.form.branchMain')}</SelectLabel>
                <SelectItem value={mainBranch.id} disabled={isProtected}>
                  <div className="flex items-center gap-2">
                    {isProtected ? (
                      <Lock className="h-3 w-3 text-slate-400" />
                    ) : (
                      <Unlock className="h-3 w-3 text-green-500" />
                    )}
                    <span>{t('parts.form.branchMain')}</span>
                    {isProtected && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {t('parts.form.branchLocked')}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              </SelectGroup>
            )}

            {/* ECO branches */}
            {changeOrderBranches.length > 0 && (
              <>
                {showMainOption && mainBranch && <SelectSeparator />}
                <SelectGroup>
                  <SelectLabel>{t('parts.form.ecoBranches')}</SelectLabel>
                  {changeOrderBranches.map((branch) => (
                    <SelectItem
                      key={branch.id}
                      value={branch.id}
                      disabled={branch.isLocked}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          ECO
                        </Badge>
                        <span>{branch.name.replace('eco/', '')}</span>
                        {branch.isLocked && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {t('parts.form.branchLocked')}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}

            {/* Workspace branches */}
            {workspaceBranches.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>{t('parts.form.myWorkspaces')}</SelectLabel>
                  {workspaceBranches.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          WS
                        </Badge>
                        <span>{branch.name.replace('workspace/', '')}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}

            {/* Create new workspace option - always available */}
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>{t('parts.form.createNew')}</SelectLabel>
              <SelectItem value="__create_workspace__">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                  <Plus className="h-3 w-3" />
                  {t('parts.form.newWorkspace')}
                </div>
              </SelectItem>
              {onCreateChangeOrder && (
                <SelectItem value="__create_eco__">
                  <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                    <Plus className="h-3 w-3" />
                    {t('parts.form.createEco')}
                  </div>
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      {/* Create Workspace Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('parts.form.createWorkspaceTitle')}</DialogTitle>
            <DialogDescription>
              {t('parts.form.createWorkspaceBody')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <FormField
              label={t('parts.form.workspaceName')}
              required
              error={createError || undefined}
              helpText={t('parts.form.workspaceNameHelp')}
            >
              <Input
                placeholder={t('parts.form.workspacePlaceholder')}
                value={newWorkspaceName}
                onChange={(e) => {
                  setNewWorkspaceName(e.target.value)
                  setCreateError(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreateWorkspace()
                  }
                }}
              />
            </FormField>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false)
                setNewWorkspaceName('')
                setCreateError(null)
              }}
              disabled={creating}
            >
              {t('parts.form.cancel')}
            </Button>
            <Button onClick={handleCreateWorkspace} disabled={creating}>
              {creating ? t('parts.form.creating') : t('parts.form.createWorkspace')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
