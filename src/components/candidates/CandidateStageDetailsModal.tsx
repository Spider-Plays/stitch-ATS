import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'
import type { CandidateStatus } from '../../types'
import { Modal } from '../ui/Modal'
import {
  monthFromIsoDate,
  quarterFromDate,
  parseIsoDate,
  validateHiredMilestone,
  validateOfferMilestone,
  type HiredMilestoneInput,
  type OfferMilestoneInput,
} from '../../lib/candidateMilestones'
import { candidateStatusLabel } from '../../lib/candidatePage'
import { AppSelect } from '../ui/AppSelect'
import { quarterSelectOptions } from '../../lib/selectOptions'

const inputClass =
  'w-full px-4 py-2.5 rounded-xl border border-primary/10 dark:border-white/10 bg-white dark:bg-white/[0.02] text-sm font-medium text-primary dark:text-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none'

const labelClass =
  'block text-[10px] font-bold text-primary/50 dark:text-white/50 uppercase tracking-wider mb-1.5'

type CandidateStageDetailsModalProps = {
  open: boolean
  targetStatus: 'OFFER' | 'HIRED'
  candidateName: string
  onClose: () => void
  onConfirm: (milestone: OfferMilestoneInput | HiredMilestoneInput) => void
  isSubmitting?: boolean
}

const emptyOffer = (): OfferMilestoneInput => ({
  offerDate: '',
  offerMonth: '',
  offerQuarter: '',
  expectedJoiningDate: '',
})

const emptyHired = (): HiredMilestoneInput => ({
  joiningDate: '',
  joiningMonth: '',
  joiningQuarter: '',
})

export function CandidateStageDetailsModal({
  open,
  targetStatus,
  candidateName,
  onClose,
  onConfirm,
  isSubmitting,
}: CandidateStageDetailsModalProps) {
  const [offer, setOffer] = useState<OfferMilestoneInput>(emptyOffer)
  const [hired, setHired] = useState<HiredMilestoneInput>(emptyHired)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setOffer(emptyOffer())
    setHired(emptyHired())
    setError(null)
  }, [open, targetStatus])

  const syncOfferFromDate = (isoDate: string) => {
    const d = parseIsoDate(isoDate)
    if (!d) return
    setOffer((prev) => ({
      ...prev,
      offerDate: isoDate,
      offerMonth: monthFromIsoDate(isoDate),
      offerQuarter: quarterFromDate(d),
    }))
  }

  const syncHiredFromDate = (isoDate: string) => {
    const d = parseIsoDate(isoDate)
    if (!d) return
    setHired((prev) => ({
      ...prev,
      joiningDate: isoDate,
      joiningMonth: monthFromIsoDate(isoDate),
      joiningQuarter: quarterFromDate(d),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (targetStatus === 'OFFER') {
      const err = validateOfferMilestone(offer)
      if (err) {
        setError(err)
        return
      }
      onConfirm(offer)
    } else {
      const err = validateHiredMilestone(hired)
      if (err) {
        setError(err)
        return
      }
      onConfirm(hired)
    }
  }

  const title =
    targetStatus === 'OFFER'
      ? `Mark as ${candidateStatusLabel('OFFER')}`
      : `Mark as ${candidateStatusLabel('HIRED')}`

  return (
    <Modal open={open} onClose={onClose} className="max-w-lg" aria-labelledby="stage-details-title">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-primary/10 dark:border-white/10 bg-white dark:bg-slate-900 shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-primary/10 dark:border-white/10">
          <div>
            <h2
              id="stage-details-title"
              className="text-lg font-bold text-primary dark:text-white"
            >
              {title}
            </h2>
            <p className="text-sm text-primary/50 dark:text-white/50 mt-0.5">
              {candidateName} — required before updating pipeline status.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-primary/40 hover:bg-primary/5 dark:hover:bg-white/10"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[min(70vh,520px)] overflow-y-auto">
          {targetStatus === 'OFFER' ? (
            <>
              <div>
                <label className={labelClass}>Date of offer</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={offer.offerDate}
                  onChange={(e) => syncOfferFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Month of offer</label>
                <input
                  type="month"
                  required
                  className={inputClass}
                  value={offer.offerMonth}
                  onChange={(e) =>
                    setOffer((prev) => ({ ...prev, offerMonth: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Quarter of offer</label>
                <AppSelect
                  value={offer.offerQuarter}
                  onChange={(offerQuarter) => setOffer((prev) => ({ ...prev, offerQuarter }))}
                  options={quarterSelectOptions()}
                  placeholder="Select quarter"
                  aria-label="Quarter of offer"
                />
              </div>
              <div>
                <label className={labelClass}>Expected joining date</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={offer.expectedJoiningDate}
                  onChange={(e) =>
                    setOffer((prev) => ({ ...prev, expectedJoiningDate: e.target.value }))
                  }
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className={labelClass}>Date of joining</label>
                <input
                  type="date"
                  required
                  className={inputClass}
                  value={hired.joiningDate}
                  onChange={(e) => syncHiredFromDate(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Month of joining</label>
                <input
                  type="month"
                  required
                  className={inputClass}
                  value={hired.joiningMonth}
                  onChange={(e) =>
                    setHired((prev) => ({ ...prev, joiningMonth: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className={labelClass}>Quarter of joining</label>
                <AppSelect
                  value={hired.joiningQuarter}
                  onChange={(joiningQuarter) => setHired((prev) => ({ ...prev, joiningQuarter }))}
                  options={quarterSelectOptions()}
                  placeholder="Select quarter"
                  aria-label="Quarter of joining"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-xs font-bold text-red-500" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 px-6 py-4 border-t border-primary/10 dark:border-white/10 bg-primary/[0.02] dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-primary/70 dark:text-white/70 hover:bg-primary/5 dark:hover:bg-white/10 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving…' : 'Confirm & update status'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function requiresStageDetailsModal(status: CandidateStatus): status is 'OFFER' | 'HIRED' {
  return status === 'OFFER' || status === 'HIRED'
}
