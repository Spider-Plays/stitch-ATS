import React from 'react'
import { Download, FileText, Loader2, Upload } from 'lucide-react'
import type { Candidate } from '@/types'

type CandidateProfileResumeProps = {
  candidate: Candidate
  hasResume: boolean
  isPdfResume: boolean
  resumeBlobUrl: string | null
  resumeLoading: boolean
  canEdit: boolean
  isUploadingResume: boolean
  onUpload: (file: File) => void
}

export function CandidateProfileResume({
  candidate,
  hasResume,
  isPdfResume,
  resumeBlobUrl,
  resumeLoading,
  canEdit,
  isUploadingResume,
  onUpload,
}: CandidateProfileResumeProps) {
  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="p-4 rounded-2xl border-2 border-dashed border-primary/20 dark:border-white/20 bg-primary/[0.02] dark:bg-white/[0.02]">
          <label className="flex items-center gap-2 text-sm font-bold text-primary dark:text-white mb-2">
            <Upload size={16} />
            {hasResume ? 'Replace resume' : 'Upload resume'}
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            disabled={isUploadingResume}
            className="w-full text-sm disabled:opacity-50"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onUpload(file)
              e.target.value = ''
            }}
          />
          <p className="mt-2 text-xs text-primary/50 dark:text-white/50">
            PDF, DOC, or DOCX · max 5 MB · uploads immediately
          </p>
        </div>
      )}

      {resumeLoading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-primary/50 dark:text-white/50">
          <Loader2 size={28} className="animate-spin" />
          <p className="text-sm font-medium">Loading resume…</p>
        </div>
      ) : hasResume ? (
        <div className="min-h-[75vh] rounded-2xl border border-primary/10 dark:border-white/10 overflow-hidden flex flex-col bg-primary/[0.02] dark:bg-white/[0.02]">
          <div className="p-3 border-b border-primary/10 dark:border-white/10 bg-white dark:bg-white/5 flex justify-between items-center gap-4">
            <span className="text-sm font-bold text-primary dark:text-white flex items-center gap-2 truncate">
              <FileText size={16} />
              {candidate.resumeFileName}
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
          {isPdfResume && resumeBlobUrl ? (
            <iframe
              src={resumeBlobUrl}
              className="w-full h-[72vh] min-h-[640px] bg-white border-0"
              title="Resume preview"
            />
          ) : (
            <div className="flex-1 min-h-[72vh] flex flex-col items-center justify-center p-12 text-center">
              <FileText className="text-primary/20 dark:text-white/20 mb-4" size={48} />
              <p className="font-bold text-primary dark:text-white">
                Preview not available for Word files
              </p>
              {resumeBlobUrl && (
                <a
                  href={resumeBlobUrl}
                  download={candidate.resumeFileName || 'resume'}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
                >
                  Download resume
                </a>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border-2 border-dashed border-primary/15 dark:border-white/15">
          <FileText className="mx-auto text-primary/20 dark:text-white/20 mb-4" size={48} />
          <p className="font-bold text-primary dark:text-white">No resume uploaded yet</p>
          <p className="text-primary/50 dark:text-white/50 text-sm mt-1 max-w-sm mx-auto">
            {canEdit
              ? 'Use the upload area above to attach a resume.'
              : 'No resume on file for this candidate.'}
          </p>
        </div>
      )}
    </div>
  )
}
