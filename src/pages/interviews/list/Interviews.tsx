import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Plus,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Ban,
} from 'lucide-react'
import { api } from '@/services/api'
import { ListSearchBar } from '@/components/ui/ListSearchBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { heroBtnPrimary } from '@/components/layout/PageHero'
import { EmptyState } from '@/components/ui/EmptyState'
import { matchesAnySearch } from '@/lib/textSearch'
import { Interview } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import { useToastStore } from '@/store/toastStore'
import { useConfirm } from '@/hooks/useConfirm'
import { canScheduleInterviews, isAssignedInterviewer } from '@/permissions'
import { getInterviewDisplayLabel } from '@/lib/interviewDisplayStatus'
import {
  filterInterviews,
  formatInterviewDay,
  groupInterviewsByDay,
  interviewStats,
  isUpcoming,
  needsFeedback,
  type InterviewFilter,
} from '@/pages/interviews/_shared/interview.utils'
import { InterviewStatCard } from '@/components/interviews/InterviewStatCard'
import { InterviewListItem } from '@/components/interviews/InterviewListItem'
import { AnimatedTabNav } from '@/components/motion/AnimatedTabNav'
import './list.css'

const FILTERS: { id: InterviewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'feedback', label: 'Needs feedback' },
  { id: 'completed', label: 'Decided' },
  { id: 'cancelled', label: 'Cancelled' },
]

const Interviews = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<InterviewFilter>('all')
  const { user } = useAuth()
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const queryClient = useQueryClient()
  const canManage = canScheduleInterviews(user?.role)

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: api.interviews.list,
  })

  const scopedInterviews = useMemo(() => {
    if (user?.role === 'INTERVIEWER' && user.uid) {
      return interviews.filter((i) => isAssignedInterviewer(i, user.uid))
    }
    return interviews
  }, [interviews, user?.role, user?.uid])

  const { data: requirements = [] } = useQuery({
    queryKey: ['requirements'],
    queryFn: api.requirements.list,
  })

  const jobTitleById = useMemo(
    () => new Map(requirements.map((r) => [r.id, r.title])),
    [requirements]
  )

  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.interviews.updateStatus(id, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      addToast('Interview cancelled', 'success')
    },
    onError: () => addToast('Failed to cancel interview', 'error'),
  })

  const handleCancel = async (interview: Interview) => {
    const stage = interview.stageName ?? interview.type.replace(/_/g, ' ')
    const ok = await confirm({
      title: 'Cancel interview',
      message: `Cancel the ${stage} interview with ${interview.candidateName ?? 'this candidate'}?`,
      confirmLabel: 'Cancel interview',
      variant: 'danger',
    })
    if (!ok) return
    cancelMutation.mutate(interview.id)
  }

  const searched = useMemo(
    () =>
      scopedInterviews.filter((i) =>
        matchesAnySearch(
          [
            i.candidateName,
            i.candidateRole,
            i.candidateEmail,
            i.stageName,
            i.type,
            getInterviewDisplayLabel(i),
            i.status,
            jobTitleById.get(i.requirementId),
          ],
          searchTerm
        )
      ),
    [scopedInterviews, searchTerm, jobTitleById]
  )

  const stats = useMemo(() => interviewStats(searched), [searched])
  const filtered = useMemo(() => filterInterviews(searched, filter), [searched, filter])

  const feedbackQueue = useMemo(
    () => searched.filter(needsFeedback).sort(
      (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    ),
    [searched]
  )

  const upcomingList = useMemo(
    () =>
      (filter === 'all' ? searched : filtered)
        .filter(isUpcoming)
        .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()),
    [searched, filtered, filter]
  )

  const upcomingByDay = useMemo(() => groupInterviewsByDay(upcomingList), [upcomingList])

  const historyList = useMemo(() => {
    const list =
      filter === 'upcoming'
        ? []
        : filter === 'all'
          ? searched.filter((i) => !isUpcoming(i))
          : filtered.filter((i) => !isUpcoming(i))
    const skipFeedbackDupes =
      filter === 'all' ? new Set(feedbackQueue.map((i) => i.id)) : new Set<string>()
    return list
      .filter((i) => !skipFeedbackDupes.has(i.id))
      .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
  }, [searched, filtered, filter, feedbackQueue])

  const showFeedbackBanner = filter === 'all' && feedbackQueue.length > 0
  const showAgenda = filter === 'all' || filter === 'upcoming'
  const showHistory = filter !== 'upcoming'

  const jobTitle = (id: string) => jobTitleById.get(id)

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={Calendar}
        eyebrow="Interview hub"
        title="Interviews"
        description="L1 → L2 → HR pipeline. Track upcoming sessions, submit feedback, and move candidates through each stage."
        actions={
          canManage ? (
            <Link to="/interviews/new" className={heroBtnPrimary}>
              <Plus size={18} />
              Schedule interview
            </Link>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <InterviewStatCard
          label="Upcoming"
          value={stats.upcoming}
          icon={CalendarClock}
          accent="blue"
          active={filter === 'upcoming'}
          onClick={() => setFilter(filter === 'upcoming' ? 'all' : 'upcoming')}
        />
        <InterviewStatCard
          label="Needs feedback"
          value={stats.feedback}
          icon={AlertCircle}
          accent="amber"
          active={filter === 'feedback'}
          onClick={() => setFilter(filter === 'feedback' ? 'all' : 'feedback')}
        />
        <InterviewStatCard
          label="Decided"
          value={stats.completed}
          icon={CheckCircle2}
          accent="green"
          active={filter === 'completed'}
          onClick={() => setFilter(filter === 'completed' ? 'all' : 'completed')}
        />
        <InterviewStatCard
          label="Cancelled"
          value={stats.cancelled}
          icon={Ban}
          accent="slate"
          active={filter === 'cancelled'}
          onClick={() => setFilter(filter === 'cancelled' ? 'all' : 'cancelled')}
        />
      </div>

      {/* Search + filters */}
      <div className="list-toolbar">
        <ListSearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search candidate, stage, job, or status..."
          className="w-full min-w-0 max-w-none flex-1"
        />
        <AnimatedTabNav
          layoutId="interviews-list-filters"
          variant="pill"
          uppercase
          className="list-toolbar-filters shrink-0"
          aria-label="Filter interviews"
          tabs={FILTERS.map((f) => ({ id: f.id, label: f.label }))}
          activeId={filter}
          onChange={(id) => setFilter(id as InterviewFilter)}
        />
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-medium">
          Loading interviews...
        </div>
      ) : searched.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-primary/15 dark:border-white/15">
          <EmptyState
            icon="event_busy"
            title={searchTerm.trim() ? 'No matches' : 'No interviews yet'}
            description={
              searchTerm.trim()
                ? 'Try a different search or clear filters.'
                : canManage
                  ? 'Schedule the first L1 interview for a candidate on a job.'
                  : 'Interviews scheduled for you will appear here.'
            }
          />
          {canManage && !searchTerm.trim() && (
            <div className="pb-10 flex justify-center">
              <Link
                to="/interviews/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                <Plus size={16} /> Schedule interview
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {/* Feedback queue */}
          {showFeedbackBanner && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-primary dark:text-white">
                      Needs your attention
                    </h2>
                    <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                      {feedbackQueue.length} interview
                      {feedbackQueue.length === 1 ? '' : 's'} awaiting feedback
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFilter('feedback')}
                  className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline shrink-0"
                >
                  View all
                </button>
              </div>
              <div className="space-y-3">
                {feedbackQueue.slice(0, 3).map((interview) => (
                  <InterviewListItem
                    key={interview.id}
                    interview={interview}
                    jobTitle={jobTitle(interview.requirementId)}
                    variant="alert"
                    canManage={canManage}
                    userRole={user?.role}
                    currentUserId={user?.uid}
                    onCancel={handleCancel}
                    cancelPending={cancelMutation.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Agenda */}
          {showAgenda && upcomingList.length > 0 && (
            <section className="space-y-6">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                  <CalendarClock size={20} />
                </div>
                <h2 className="text-lg font-bold text-primary dark:text-white">Agenda</h2>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {upcomingList.length} upcoming
                </span>
              </div>
              <div className="space-y-8">
                {[...upcomingByDay.entries()].map(([dayKey, dayInterviews]) => (
                  <div key={dayKey}>
                    <h3 className="text-sm font-black text-muted-foreground uppercase tracking-wider mb-3 sticky top-0 py-2 bg-background/90 backdrop-blur-sm z-10">
                      {formatInterviewDay(new Date(dayKey))}
                    </h3>
                    <div className="space-y-3 pl-0 md:pl-4 border-l-0 md:border-l-2 border-primary/10 dark:border-white/10 md:ml-2">
                      {dayInterviews.map((interview) => (
                        <InterviewListItem
                          key={interview.id}
                          interview={interview}
                          jobTitle={jobTitle(interview.requirementId)}
                          variant="timeline"
                          canManage={canManage}
                          userRole={user?.role}
                          onCancel={handleCancel}
                          cancelPending={cancelMutation.isPending}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showAgenda && upcomingList.length === 0 && filter === 'upcoming' && (
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-primary/10 dark:border-white/10">
              <EmptyState icon="event" title="No upcoming interviews" description="Schedule the next stage when a candidate is ready." />
            </div>
          )}

          {/* History / filtered list */}
          {showHistory && historyList.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
                  <CheckCircle2 size={20} />
                </div>
                <h2 className="text-lg font-bold text-primary dark:text-white">
                  {filter === 'feedback'
                    ? 'Awaiting feedback'
                    : filter === 'completed'
                      ? 'Decided'
                      : filter === 'cancelled'
                        ? 'Cancelled'
                        : 'Past & other'}
                </h2>
                <span className="text-xs font-bold text-muted-foreground">
                  {historyList.length}
                </span>
              </div>
              <div className="space-y-3">
                {historyList.map((interview) => (
                  <InterviewListItem
                    key={interview.id}
                    interview={interview}
                    jobTitle={jobTitle(interview.requirementId)}
                    variant="row"
                    canManage={canManage}
                    userRole={user?.role}
                    currentUserId={user?.uid}
                    onCancel={handleCancel}
                    cancelPending={cancelMutation.isPending}
                  />
                ))}
              </div>
            </section>
          )}

          {showHistory && historyList.length === 0 && filter !== 'all' && (
            <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-primary/10 dark:border-white/10">
              <EmptyState
                icon="filter_list"
                title="Nothing in this view"
                description="Try another filter or schedule a new interview."
              />
            </div>
          )}

          {filter === 'all' && upcomingList.length === 0 && historyList.length === 0 && searched.length > 0 && (
            <EmptyState icon="search" title="No results" description="Adjust your search term." />
          )}
        </div>
      )}
    </div>
  )
}

export default Interviews
