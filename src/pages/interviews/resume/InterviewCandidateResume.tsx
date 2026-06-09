import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, FileText, Loader2 } from 'lucide-react'
import { api } from '@/services/api'
import { showInterviewerSessionActions } from '@/permissions'
import { useAuth } from '@/hooks/useAuth'
import './resume.css'

const InterviewCandidateResume = () => {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [resumeBlobUrl, setResumeBlobUrl] = useState<string | null>(null)
  const [resumeError, setResumeError] = useState<string | null>(null)
  const [resumeLoading, setResumeLoading] = useState(false)

  const { data: interview, isLoading: interviewLoading } = useQuery({
    queryKey: ['interview', id],
    queryFn: () => api.interviews.get(id!),
    enabled: !!id,
  })

  const { data: candidate } = useQuery({
    queryKey: ['candidate', interview?.candidateId],
    queryFn: () => api.candidates.get(interview!.candidateId),
    enabled: !!interview?.candidateId,
  })

  const canAccess =
    interview && showInterviewerSessionActions(interview, user?.uid)

  useEffect(() => {
    if (!id || !interview?.candidateId) return
    const hasResume = !!(candidate?.resumeFileName || candidate?.resumeUrl)
    if (!hasResume) return

    let objectUrl: string | null = null
    let cancelled = false

    const load = async () => {
      setResumeLoading(true)
      setResumeError(null)
      try {
        const blob = await api.interviews.fetchCandidateResume(id)
        if (cancelled || !blob) return
        objectUrl = URL.createObjectURL(blob)
        setResumeBlobUrl(objectUrl)
      } catch (e) {
        if (!cancelled) {
          setResumeBlobUrl(null)
          setResumeError(e instanceof Error ? e.message : 'Could not load resume')
        }
      } finally {
        if (!cancelled) setResumeLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, interview?.candidateId, candidate?.resumeFileName, candidate?.resumeUrl])

  const isPdf =
    candidate?.resumeMimeType === 'application/pdf' ||
    candidate?.resumeFileName?.toLowerCase().endsWith('.pdf')

  if (interviewLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground font-medium">
        Loading…
      </div>
    )
  }

  if (!interview) {
    return (
      <div className="py-20 text-center">
        <p className="font-bold text-primary dark:text-white">Interview not found</p>
      </div>
    )
  }

  if (!canAccess && user?.role === 'INTERVIEWER') {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <p className="font-bold text-primary dark:text-white">
          You are not assigned to this interview
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-black text-primary dark:text-white tracking-tight">
          {candidate?.name ?? interview.candidateName ?? 'Candidate'} — Resume
        </h1>
        <p className="text-sm text-primary/60 dark:text-white/60 mt-1">
          {interview.stageName ?? interview.type.replace(/_/g, ' ')} ·{' '}
          {new Date(interview.scheduledAt).toLocaleString()}
        </p>
        {candidate && (
          <Link
            to={`/candidates/${candidate.id}?tab=resume`}
            className="inline-block mt-2 text-xs font-bold text-primary dark:text-white hover:underline"
          >
            Open full candidate profile
          </Link>
        )}
      </div>

      {resumeLoading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-primary/50 dark:text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading resume…</p>
        </div>
      ) : resumeError ? (
        <div className="p-6 rounded-2xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 text-red-800 dark:text-red-200 text-sm font-medium">
          {resumeError}
        </div>
      ) : candidate?.resumeFileName || candidate?.resumeUrl ? (
        <div className="min-h-[75vh] rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden flex flex-col bg-white dark:bg-white/5">
          <div className="p-3 border-b border-primary/10 dark:border-white/10 flex justify-between items-center gap-4">
            <span className="text-sm font-bold text-primary dark:text-white flex items-center gap-2 truncate">
              <FileText size={16} />
              {candidate.resumeFileName ?? 'Resume'}
            </span>
            {resumeBlobUrl && (
              <a
                href={resumeBlobUrl}
                download={candidate.resumeFileName || 'resume'}
                className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary dark:text-white hover:opacity-80 shrink-0"
              >
                <Download size={14} />
                Download
              </a>
            )}
          </div>
          {isPdf && resumeBlobUrl ? (
            <iframe
              src={resumeBlobUrl}
              className="w-full h-[72vh] min-h-[640px] bg-white border-0"
              title="Resume preview"
            />
          ) : (
            <div className="p-8 text-center text-sm text-primary/60 dark:text-white/60">
              {resumeBlobUrl ? (
                <a
                  href={resumeBlobUrl}
                  download={candidate.resumeFileName}
                  className="font-bold text-primary dark:text-white hover:underline"
                >
                  Download resume file
                </a>
              ) : (
                'Preview not available for this file type.'
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-primary/15 dark:border-white/15 text-center text-sm font-medium text-primary/50 dark:text-white/50">
          No resume has been uploaded for this candidate yet.
        </div>
      )}
    </div>
  )
}

export default InterviewCandidateResume
