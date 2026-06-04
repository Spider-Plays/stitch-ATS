import type { ActivityLog } from '../types'

export type ActivityNotificationItem = {
  id: string
  type: 'ACTION_REQUIRED' | 'UPDATE' | 'SYSTEM'
  title: string
  subtitle: string
  time: string
  read: boolean
  icon: string
  colorClass: string
  link?: string
  timestamp: number
}

function formatLogTime(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString() +
    ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
}

function interviewStageSubtitle(log: ActivityLog): string {
  const d = log.details
  if (!d || typeof d !== 'object') return log.performerName || 'System'
  const parts: string[] = []
  if ('stageName' in d && d.stageName) parts.push(String(d.stageName))
  if ('scheduledAt' in d && d.scheduledAt) {
    parts.push(new Date(String(d.scheduledAt)).toLocaleString())
  }
  const by = log.performerName ? ` · ${log.performerName}` : ''
  return (parts.length > 0 ? parts.join(' · ') : 'Interview update') + by
}

export function activityLogToNotificationItem(log: ActivityLog): ActivityNotificationItem {
  let title = 'System activity'
  let subtitle = log.action.replace(/_/g, ' ').toLowerCase()
  let icon = 'info'
  let colorClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
  let link = '#'
  let recognized = false

  if (log.entityType === 'REQUIREMENT') {
    recognized = true
    link = `/requirements/${log.entityId}`
    icon = 'work'
    if (log.action === 'CREATED') {
      title = 'New requirement created'
      subtitle = `${log.details?.title ?? 'Role'} by ${log.performerName || 'User'}`
      colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    } else if (log.action === 'APPROVED') {
      title = 'Requirement approved'
      subtitle = `${log.details?.title ?? 'Role'} approved by ${log.performerName || 'User'}`
      colorClass = 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
    } else if (log.action === 'REJECTED') {
      title = 'Requirement rejected'
      subtitle = `${log.details?.title ?? 'Role'} rejected by ${log.performerName || 'User'}`
      colorClass = 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
    } else if (log.action === 'UPDATED') {
      title = 'Requirement updated'
      subtitle = `${log.details?.title ?? 'Role'} updated by ${log.performerName || 'User'}`
    }
  } else if (log.entityType === 'OFFER') {
    recognized = true
    link = `/offers/${log.entityId}`
    icon = 'description'
    if (log.action === 'CREATED') {
      title = 'Offer created'
      subtitle = `New offer draft by ${log.performerName || 'User'}`
      colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    } else if (log.action === 'STATUS_CHANGED') {
      title = 'Offer status changed'
      subtitle = `Status: ${log.details?.status ?? 'updated'} · ${log.performerName || 'User'}`
      colorClass = 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
    } else if (log.action === 'UPDATED') {
      title = 'Offer updated'
      subtitle = `Offer updated by ${log.performerName || 'User'}`
    }
  } else if (log.entityType === 'INTERVIEW') {
    recognized = true
    link = `/interviews`
    icon = 'event'
    const candidateId =
      log.details && typeof log.details === 'object' && 'candidateId' in log.details
        ? String(log.details.candidateId)
        : undefined
    if (candidateId) link = `/candidates/${candidateId}`

    if (log.action === 'SCHEDULED') {
      title = 'Interview scheduled'
      subtitle = interviewStageSubtitle(log)
      colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    } else if (log.action === 'RESCHEDULED') {
      title = 'Interview rescheduled'
      subtitle = interviewStageSubtitle(log)
      colorClass = 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400'
    } else if (log.action === 'UPDATED') {
      title = 'Interview updated'
      subtitle = interviewStageSubtitle(log)
    } else if (log.action === 'STATUS_CHANGED') {
      title =
        log.details?.status === 'CANCELLED' ? 'Interview cancelled' : 'Interview status changed'
      subtitle = interviewStageSubtitle(log)
      colorClass =
        log.details?.status === 'CANCELLED'
          ? 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
          : colorClass
    } else if (log.action === 'FEEDBACK_SUBMITTED') {
      title = 'Feedback submitted'
      subtitle = `${log.performerName || 'Interviewer'} submitted interview feedback`
      link = `/interviews/${log.entityId}/feedback`
      colorClass = 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400'
    } else if (log.action === 'FEEDBACK_DELETED') {
      title = 'Feedback removed'
      subtitle = `Feedback removed by ${log.performerName || 'Admin'}`
      link = `/interviews/${log.entityId}/feedback`
    }
  } else if (log.entityType === 'CANDIDATE') {
    recognized = true
    link = `/candidates/${log.entityId}`
    icon = 'person'
    if (log.action === 'CREATED') {
      title = 'New candidate added'
      subtitle = `${log.details?.name} for ${log.details?.jobTitle ?? 'a role'}`
      colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
    } else if (log.action === 'STATUS_UPDATED') {
      title = 'Candidate stage moved'
      subtitle = `${log.details?.name} moved to ${log.details?.status}`
      colorClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400'
    } else if (log.action.startsWith('INTERVIEW_')) {
      title =
        log.action === 'INTERVIEW_SCHEDULED'
          ? 'Interview scheduled'
          : log.action === 'INTERVIEW_RESCHEDULED'
            ? 'Interview rescheduled'
            : log.action === 'INTERVIEW_CANCELLED'
              ? 'Interview cancelled'
              : log.action === 'INTERVIEW_FEEDBACK_DELETED'
                ? 'Interview feedback removed'
                : 'Interview updated'
      subtitle = interviewStageSubtitle(log)
      if (log.action === 'INTERVIEW_SCHEDULED') {
        colorClass = 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
      } else if (log.action === 'INTERVIEW_CANCELLED') {
        colorClass = 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      }
    }
  }

  const type: ActivityNotificationItem['type'] = recognized ? 'UPDATE' : 'SYSTEM'

  return {
    id: log.id,
    type,
    title,
    subtitle,
    time: formatLogTime(log.timestamp),
    read: true,
    icon,
    colorClass,
    link: link === '#' ? undefined : link,
    timestamp: new Date(log.timestamp).getTime(),
  }
}
