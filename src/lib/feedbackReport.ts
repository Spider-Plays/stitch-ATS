import {
  InterviewFeedbackFormData,
  ratingLabel,
  recommendationLabel,
  parseFormData,
} from '../config/interviewFeedbackForm'
import { Feedback } from '../types'

export type FeedbackReportMeta = {
  candidateName: string
  candidateRole?: string
  interviewType: string
  interviewDate: string
  interviewerName: string
  jobTitle?: string
}

export function buildFeedbackReportHtml(feedback: Feedback, meta: FeedbackReportMeta): string {
  const formData = parseFormData(feedback.formData)
  const submitted = new Date(feedback.createdAt).toLocaleString()

  const skillRows = formData.skillAssessment
    .map(
      (row) => `
    <tr>
      <td>${esc(row.skillAssessed || '—')}</td>
      <td>${esc(row.expectedProficiency)}</td>
      <td>${esc(row.possessProficiency)}</td>
      <td>${esc(ratingLabel(row.rating))}</td>
      <td>${esc(row.remarks || '—')}</td>
    </tr>`
    )
    .join('')

  const competencyRows = formData.competencies
    .map(
      (row) => `
    <tr>
      <td>${esc(row.topic)}</td>
      <td>${esc(ratingLabel(row.rating))}</td>
      <td>${esc(row.remarks || '—')}</td>
    </tr>`
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Interview Feedback - ${esc(meta.candidateName)}</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #1a1a1a; margin: 40px; }
    h1 { font-size: 16pt; border-bottom: 2px solid #1a2b3c; padding-bottom: 8px; margin-bottom: 4px; }
    h2 { font-size: 12pt; margin-top: 24px; margin-bottom: 8px; color: #1a2b3c; }
    .meta { font-size: 10pt; color: #555; margin-bottom: 20px; }
    .meta p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 16px; }
    th, td { border: 1px solid #999; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #f0f4f8; font-weight: bold; font-size: 10pt; }
    .overall-box { border: 1px solid #999; padding: 12px; margin-top: 8px; background: #fafafa; }
    .recommendation { font-weight: bold; font-size: 12pt; margin-bottom: 8px; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Interview Feedback Form</h1>
  <div class="meta">
    <p><strong>Candidate:</strong> ${esc(meta.candidateName)}${meta.candidateRole ? ` — ${esc(meta.candidateRole)}` : ''}</p>
    <p><strong>Interview:</strong> ${esc(meta.interviewType)} · ${esc(meta.interviewDate)}</p>
    ${meta.jobTitle ? `<p><strong>Position:</strong> ${esc(meta.jobTitle)}</p>` : ''}
    <p><strong>Interviewer:</strong> ${esc(meta.interviewerName)}</p>
    <p><strong>Submitted:</strong> ${esc(submitted)}</p>
  </div>

  <h2>Overall Feedback</h2>
  <div class="overall-box">
    <p class="recommendation">Recommendation: ${esc(recommendationLabel(feedback.recommendation))}</p>
    <p><strong>Comments:</strong></p>
    <p>${esc(feedback.comments).replace(/\n/g, '<br/>')}</p>
  </div>

  <h2>Skill Assessment</h2>
  <table>
    <thead>
      <tr>
        <th>Skill Assessed</th>
        <th>Expected Proficiency</th>
        <th>Possess Proficiency</th>
        <th>Rating</th>
        <th>Remarks / Comments</th>
      </tr>
    </thead>
    <tbody>${skillRows}</tbody>
  </table>

  <h2>Standard Competency Description</h2>
  <table>
    <thead>
      <tr>
        <th>Topic</th>
        <th>Rating</th>
        <th>Remarks / Comments</th>
      </tr>
    </thead>
    <tbody>${competencyRows}</tbody>
  </table>
</body>
</html>`
}

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function downloadFeedbackHtml(feedback: Feedback, meta: FeedbackReportMeta): void {
  const html = buildFeedbackReportHtml(feedback, meta)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeName = meta.candidateName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_')
  a.href = url
  a.download = `Interview_Feedback_${safeName}_${feedback.id.slice(0, 8)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

export function printFeedbackReport(feedback: Feedback, meta: FeedbackReportMeta): void {
  const html = buildFeedbackReportHtml(feedback, meta)
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
}
