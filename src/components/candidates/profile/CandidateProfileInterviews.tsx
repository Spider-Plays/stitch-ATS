import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Ban,
} from 'lucide-react'
import { AnimatedTabNav } from '../../motion/AnimatedTabNav'
import { TabContent } from '../../motion/TabContent'
import type { Candidate, Interview, Requirement } from '../../../types'
import { api } from '../../../services/api'
import { useToastStore } from '../../../store/toastStore'
import { useConfirm } from '../../../hooks/useConfirm'
import { InterviewListItem } from '../../interviews/InterviewListItem'
import { InterviewStatCard } from '../../interviews/InterviewStatCard'
import { EmptyState } from '../../ui/EmptyState'
import { CandidateInterviewPipeline } from './CandidateInterviewPipeline'
import { CandidateInterviewScheduleForm } from './CandidateInterviewScheduleForm'
import {
  candidateInterviewStats,
  filterCandidateInterviews,
  feedbackCandidateInterviews,
  sortCandidateInterviews,
  type CandidateInterviewFilter,
} from '../../../lib/candidateProfilePage'
import { canEditInterviewPlan } from '../../../lib/interviewPlanPermissions'

const FILTERS: { id: CandidateInterviewFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'feedback', label: 'Needs feedback' },
  { id: 'completed', label: 'Decided' },
  { id: 'cancelled', label: 'Cancelled' },
]

type CandidateProfileInterviewsProps = {
  candidate: Candidate
  requirement?: Requirement
  interviews: Interview[]
  canManage: boolean
  userRole?: string | null
  currentUserId?: string | null
}

export function CandidateProfileInterviews({
  candidate,
  requirement,
  interviews,
  canManage,
  userRole,
  currentUserId,
}: CandidateProfileInterviewsProps) {
  const [filter, setFilter] = useState<CandidateInterviewFilter>('all')
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const { addToast } = useToastStore()
  const confirm = useConfirm()
  const queryClient = useQueryClient()

  const jobTitle = candidate.jobTitle || candidate.role
  const canEditPlan = canEditInterviewPlan(userRole)

  const { data: progress } = useQuery({
    queryKey: ['interview-progress', candidate.requirementId, candidate.id],
    queryFn: () =>
      api.requirements.getCandidateInterviewProgress(
        candidate.requirementId!,
        candidate.id
      ),
    enabled: !!candidate.requirementId,
  })

  const cancelMutation = useMutation({
    mutationFn: (interviewId: string) =>
      api.interviews.updateStatus(interviewId, 'CANCELLED'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidate-interviews', candidate.id] })
      queryClient.invalidateQueries({
        queryKey: ['interview-progress', candidate.requirementId, candidate.id],
      })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['candidate-activity', candidate.id] })
      addToast('Interview cancelled', 'success')
    },
    onError: () => addToast('Failed to cancel interview', 'error'),
  })

  const handleCancel = async (interview: Interview) => {
    const stage = interview.stageName ?? interview.type.replace(/_/g, ' ')
    const ok = await confirm({
      title: 'Cancel interview',
      message: `Cancel the ${stage} interview for ${candidate.name}?`,
      confirmLabel: 'Cancel interview',
      variant: 'danger',
    })
    if (!ok) return
    cancelMutation.mutate(interview.id)
  }

  const stats = useMemo(() => candidateInterviewStats(interviews), [interviews])
  const feedbackQueue = useMemo(() => feedbackCandidateInterviews(interviews), [interviews])

  const filtered = useMemo(() => {
    let list = filterCandidateInterviews(interviews, filter)
    if (filter === 'all' && feedbackQueue.length > 0) {
      const skip = new Set(feedbackQueue.map((f) => f.id))
      list = list.filter((iv) => !skip.has(iv.id))
    }
    return sortCandidateInterviews(list)
  }, [interviews, filter, feedbackQueue])

  const handleStageSelect = (stageId: string) => {
    setSelectedStageId(stageId)
    document.getElementById('candidate-schedule-interview')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-primary dark:text-white">
          Interviews for {candidate.name}
        </h2>
        <p className="text-sm text-primary/50 dark:text-white/50 mt-0.5">
          {requirement
            ? `Pipeline and scheduling for ${requirement.title}${jobTitle ? ` · ${jobTitle}` : ''}.`
            : 'Assign a job on Overview to enable the interview pipeline.'}
        </p>
      </div>

      {!candidate.requirementId && (
        <div className="p-4 rounded-xl border border-amber-200/60 dark:border-amber-500/30 bg-amber-500/10 text-sm font-medium text-amber-900 dark:text-amber-200">
          Link this candidate to a job requirement on the Overview tab before scheduling
          interviews.
        </div>
      )}

      {candidate.requirementId && requirement && progress && (
        <>
          <CandidateInterviewPipeline
            requirementId={candidate.requirementId}
            progress={progress}
            selectedStageId={selectedStageId}
            onSelectStage={handleStageSelect}
            canManage={canManage}
            canEditPlan={canEditPlan}
          />

          {canManage && (
            <CandidateInterviewScheduleForm
              candidate={candidate}
              requirement={requirement}
              selectedStageId={selectedStageId}
              onStageChange={setSelectedStageId}
              onScheduled={() => setSelectedStageId(null)}
            />
          )}
        </>
      )}

      <div className="pt-2 border-t border-primary/10 dark:border-white/10 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-primary dark:text-white">Scheduled sessions</h3>
          <p className="text-xs text-primary/50 dark:text-white/50 mt-0.5">
            All interviews recorded for this candidate only.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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

        <AnimatedTabNav
          layoutId="candidate-interview-filters"
          variant="pill"
          uppercase
          className="w-full sm:w-auto"
          aria-label="Filter scheduled sessions"
          tabs={FILTERS.map((f) => ({ id: f.id, label: f.label }))}
          activeId={filter}
          onChange={(id) => setFilter(id as CandidateInterviewFilter)}
        />

        <TabContent activeKey={filter} className="space-y-5">
        {filter === 'all' && feedbackQueue.length > 0 && (
          <section className="space-y-3">
            <h4 className="text-sm font-bold text-primary dark:text-white flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400" />
              Needs attention ({feedbackQueue.length})
            </h4>
            {feedbackQueue.map((iv) => (
              <InterviewListItem
                key={iv.id}
                interview={iv}
                jobTitle={jobTitle}
                variant="alert"
                canManage={canManage}
                userRole={userRole}
                currentUserId={currentUserId}
                onCancel={handleCancel}
                cancelPending={cancelMutation.isPending}
                hideCandidateLink
              />
            ))}
          </section>
        )}

        {filtered.length === 0 && !(filter === 'all' && feedbackQueue.length > 0) ? (
          <div className="rounded-2xl border border-dashed border-primary/15 dark:border-white/15">
            <EmptyState
              icon="event"
              title={
                filter === 'all'
                  ? 'No interviews yet'
                  : 'Nothing in this view'
              }
              description={
                filter === 'all'
                  ? canManage && candidate.requirementId
                    ? 'Use the schedule form above to book the next round for this candidate.'
                    : 'Interviews for this candidate will appear here.'
                  : 'Try another filter.'
              }
            />
          </div>
        ) : (
          <section className="space-y-3">
            {filter !== 'all' && (
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {filtered.length} result{filtered.length === 1 ? '' : 's'}
              </p>
            )}
            {filtered.map((iv) => (
              <InterviewListItem
                key={iv.id}
                interview={iv}
                jobTitle={jobTitle}
                variant="row"
                canManage={canManage}
                userRole={userRole}
                currentUserId={currentUserId}
                onCancel={handleCancel}
                cancelPending={cancelMutation.isPending}
                hideCandidateLink
              />
            ))}
          </section>
        )}
        </TabContent>
      </div>
    </div>
  )
}
