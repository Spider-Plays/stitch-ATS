import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/services/api'
import { InterviewPanelLevel, User } from '@/types'
import { MoreHorizontal, Search, Filter, UserPlus, X } from 'lucide-react'
import clsx from 'clsx'
import { useToastStore } from '@/store/toastStore'
import { ApiError } from '@/lib/apiClient'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { InputWithIcon } from '@/components/ui/InputWithIcon'
import {
  mergeInterviewPanelLevels,
  isPanelLevelPersisted,
} from '@/lib/interviewPanelLevels'
import { UserAvatar } from '@/components/ui/UserAvatar'
import './interview-panels.css'

const INTERVIEWER_ROLES = [
  'INTERVIEWER',
  'HIRING_MANAGER',
  'TEAM_LEAD',
  'RECRUITER',
  'SUPER_ADMIN',
  'ADMIN',
  'HR_HEAD',
  'HR_MANAGER',
] as const

const roleLabel = (role: string) => role.replace(/_/g, ' ')

const InterviewerCard = ({
  user,
  onRemove,
  removing,
}: {
  user: User
  onRemove: () => void
  removing: boolean
}) => (
  <div className="group relative flex flex-col gap-3 rounded-xl border border-primary/10 bg-white p-4 shadow-sm hover:border-primary/30 hover:shadow-md dark:border-white/10 dark:bg-white/5 transition-all">
    <div className="flex items-start justify-between">
      <div className="flex gap-3">
        <UserAvatar name={user.name} avatar={user.avatar} className="h-10 w-10 rounded-lg" />
        <div>
          <h4 className="text-sm font-bold text-primary dark:text-white">{user.name}</h4>
          <div className="flex items-center gap-1 text-[11px] font-medium text-primary/50 dark:text-white/40">
            {roleLabel(user.role)}
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        className="p-1 rounded-lg text-primary/30 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
        aria-label={`Remove ${user.name} from panel`}
      >
        <X size={16} />
      </button>
    </div>

    <div className="flex flex-col gap-2">
      <div className="text-[12px] text-primary/70 dark:text-white/60 font-medium truncate">
        {user.email}
      </div>
      {user.department && (
        <div className="flex items-center gap-2 rounded bg-primary/5 p-2 dark:bg-white/5">
          <p className="text-[11px] font-medium text-primary dark:text-white">{user.department}</p>
        </div>
      )}
    </div>

    <Link
      to={`/admin/users/${user.uid}`}
      className="mt-1 w-full rounded border border-primary/10 bg-white py-1.5 text-center text-[12px] font-bold text-primary hover:bg-primary/5 dark:bg-white/5 dark:text-white dark:border-white/10 transition-colors"
    >
      View profile
    </Link>
  </div>
)

const PanelColumn = ({
  level,
  members,
  onAdd,
  onRemove,
  addOptions,
  saving,
}: {
  level: InterviewPanelLevel
  members: User[]
  onAdd: (userId: string) => void
  onRemove: (userId: string) => void
  addOptions: { value: string; label: string; sublabel?: string }[]
  saving: boolean
}) => {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="flex-shrink-0 w-80 flex flex-col h-full">
      <div className="flex items-center justify-between px-1 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary/60 dark:text-white/60">
            {level.name}
          </h3>
          <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[10px] font-bold text-primary dark:bg-white/10 dark:text-white">
            {members.length}
          </span>
        </div>
        <button
          type="button"
          className="text-primary/30 hover:text-primary dark:text-white/30 dark:hover:text-white transition-colors"
          aria-label={`${level.name} column options`}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pr-2 pb-20">
        {members.map((u) => (
          <InterviewerCard
            key={u.uid}
            user={u}
            onRemove={() => onRemove(u.uid)}
            removing={saving}
          />
        ))}

        {members.length === 0 && (
          <div className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-primary/5 dark:border-white/5 rounded-xl bg-primary/[0.02] dark:bg-white/[0.02] text-primary/30 dark:text-white/30">
            <span className="text-xs font-bold uppercase tracking-wider">No interviewers</span>
          </div>
        )}

        <div className="rounded-xl border border-dashed border-primary/15 dark:border-white/15 p-3 bg-primary/[0.02] dark:bg-white/[0.02]">
          {pickerOpen ? (
            <div className="space-y-2">
              <SearchableSelect
                value=""
                onChange={(id) => {
                  if (id) {
                    onAdd(id)
                    setPickerOpen(false)
                  }
                }}
                options={addOptions}
                placeholder="Select interviewer..."
                searchPlaceholder="Search team..."
              />
              <button
                type="button"
                onClick={() => setPickerOpen(false)}
                className="w-full text-xs font-bold text-primary/50 dark:text-white/50 hover:text-primary dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              disabled={saving || addOptions.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2 text-[12px] font-bold text-primary dark:text-white hover:bg-primary/5 dark:hover:bg-white/5 rounded-lg transition-colors disabled:opacity-50"
            >
              <UserPlus size={16} />
              Add interviewer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const AdminInterviewPanels = () => {
  const queryClient = useQueryClient()
  const { addToast } = useToastStore()
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data: levelsFromApi,
    isLoading: levelsLoading,
    isError: levelsError,
    error: levelsQueryError,
    refetch: refetchLevels,
  } = useQuery({
    queryKey: ['interview-panels'],
    queryFn: api.interviewPanels.list,
    retry: 1,
  })

  const levels = useMemo(
    () => mergeInterviewPanelLevels(levelsFromApi),
    [levelsFromApi]
  )

  const panelsReady = Boolean(levelsFromApi?.length && levelsFromApi.every((l) => l.id))

  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: api.users.list,
    retry: 1,
  })

  const interviewers = useMemo(
    () =>
      users.filter(
        (u) =>
          u.status === 'ACTIVE' &&
          INTERVIEWER_ROLES.includes(u.role as (typeof INTERVIEWER_ROLES)[number])
      ),
    [users]
  )

  const usersById = useMemo(() => new Map(users.map((u) => [u.uid, u])), [users])

  const saveMutation = useMutation({
    mutationFn: ({ levelId, interviewerIds }: { levelId: string; interviewerIds: string[] }) =>
      api.interviewPanels.update(levelId, interviewerIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interview-panels'] })
      queryClient.invalidateQueries({ queryKey: ['interview-plan'] })
      addToast('Interview panel updated', 'success')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to update panel'
      addToast(msg, 'error')
    },
  })

  const seedMutation = useMutation({
    mutationFn: api.interviewPanels.seed,
    onSuccess: (seeded) => {
      queryClient.setQueryData(['interview-panels'], seeded)
      addToast('Interview panels initialized', 'success')
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : 'Failed to initialize panels'
      addToast(msg, 'error')
    },
  })

  const levelsErrorMessage =
    levelsQueryError instanceof ApiError
      ? levelsQueryError.message
      : levelsQueryError instanceof Error
        ? levelsQueryError.message
        : 'Could not load interview panels'

  const updateLevel = (level: InterviewPanelLevel, nextIds: string[]) => {
    if (!isPanelLevelPersisted(level)) {
      addToast('Restart the API server, then click Initialize panels', 'error')
      return
    }
    saveMutation.mutate({ levelId: level.id, interviewerIds: nextIds })
  }

  const matchesSearch = (user: User) => {
    if (!searchTerm) return true
    const q = searchTerm.toLowerCase()
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q) ||
      (user.department?.toLowerCase().includes(q) ?? false)
    )
  }

  const isLoading = levelsLoading || usersLoading

  const showSetupBanner = levelsError || !panelsReady

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-4 items-center">
          <div className="size-10 m3-surface-primary rounded-xl flex items-center justify-center shadow-m3-2">
            <span className="material-symbols-outlined !text-xl">groups</span>
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
              Interview panels
            </h1>
            <p className="text-sm font-medium text-primary/60 dark:text-white/60">
              Assign default interviewers for each level — applied to all job interview plans
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <InputWithIcon
            type="text"
            icon={<Search size={18} />}
            placeholder="Search interviewers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            wrapperClassName="w-64"
            className="!min-h-10 !py-2.5 !rounded-xl text-sm"
          />
          <Link to="/admin/users">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none"
            >
              <UserPlus size={18} />
              <span>Manage users</span>
            </button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto pb-4 mb-2">
        <button
          type="button"
          onClick={() => setSearchTerm('')}
          className={clsx(
            'flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors',
            !searchTerm
              ? 'bg-primary/10 border-primary text-primary dark:bg-white/10 dark:border-white dark:text-white'
              : 'border-primary/10 bg-white hover:bg-primary/5 dark:border-white/10 dark:bg-white/5 dark:text-white'
          )}
        >
          <Filter size={14} />
          All levels
        </button>
      </div>

      {showSetupBanner && !isLoading && (
        <div className="mb-4 p-4 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 text-amber-950 dark:text-amber-100 text-sm space-y-3">
          <p className="font-bold">
            {levelsError
              ? levelsErrorMessage
              : 'Interview panel levels are not synced with the server yet.'}
          </p>
          <p className="text-amber-900/80 dark:text-amber-200/80">
            Stop any process on port 4000, run{' '}
            <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
              npm run db:generate --prefix server
            </code>
            , restart <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/40 px-1 rounded">npm run dev</code>, then initialize below.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              className="px-4 py-2 rounded-lg bg-amber-800 text-white text-sm font-bold hover:bg-amber-900 disabled:opacity-50"
            >
              {seedMutation.isPending ? 'Initializing…' : 'Initialize panels'}
            </button>
            <button
              type="button"
              onClick={() => refetchLevels()}
              className="px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-700 text-sm font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40"
            >
              Retry load
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground font-medium py-12 text-center">
          Loading interview panels...
        </p>
      ) : (
        <div className="flex-1 min-h-[420px] flex gap-6 overflow-x-auto pb-6">
          {levels.map((level) => {
            const members = level.interviewerIds
              .map((id) => usersById.get(id))
              .filter((u): u is User => !!u && matchesSearch(u))

            const addOptions = interviewers
              .filter((u) => !level.interviewerIds.includes(u.uid) && matchesSearch(u))
              .map((u) => ({
                value: u.uid,
                label: u.name,
                sublabel: `${roleLabel(u.role)} · ${u.email}`,
              }))

            return (
              <PanelColumn
                key={level.id || `level-${level.order}`}
                level={level}
                members={members}
                saving={saveMutation.isPending}
                addOptions={addOptions}
                onAdd={(userId) => updateLevel(level, [...level.interviewerIds, userId])}
                onRemove={(userId) =>
                  updateLevel(
                    level,
                    level.interviewerIds.filter((id) => id !== userId)
                  )
                }
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AdminInterviewPanels
