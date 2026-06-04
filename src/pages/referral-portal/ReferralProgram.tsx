import React from 'react'
import { Link } from 'react-router-dom'
import { Gift, CheckCircle2, HelpCircle } from 'lucide-react'

const TIERS = [
  { role: 'Individual contributor', bonus: '₹25,000 – ₹50,000', note: 'Per successful hire' },
  { role: 'Senior / niche skills', bonus: '₹50,000 – ₹1,00,000', note: 'Roles marked with bonus on job card' },
  { role: 'Leadership / critical hires', bonus: 'Up to ₹1,50,000', note: 'As approved by HR' },
]

const FAQ = [
  {
    q: 'When do I receive my referral bonus?',
    a: 'Bonuses are processed after your referral completes joining and passes the probation period defined by HR (typically 90 days).',
  },
  {
    q: 'Can I refer someone already in our ATS?',
    a: 'Each email can only exist once in the system. If they already applied or were referred, submit a different contact or ask HR.',
  },
  {
    q: 'Do I need to know the candidate personally?',
    a: 'Yes — select an accurate relationship. Misrepresentation may affect bonus eligibility.',
  },
  {
    q: 'What if my referral applies to multiple roles?',
    a: 'Submit them for the best-fit open role. Recruiters may reassign if another role is a stronger match.',
  },
]

const ReferralProgram = () => (
  <div className="max-w-3xl mx-auto space-y-8">
    <div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Referral rewards program</h1>
      <p className="text-sm text-slate-500 mt-1">
        How referrals work, bonus tiers, and eligibility at a glance.
      </p>
    </div>

    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-8 text-white">
      <Gift size={32} className="mb-4 opacity-90" />
      <h2 className="text-xl font-black">Refer great people. Get rewarded.</h2>
      <p className="mt-2 text-violet-100 max-w-lg">
        Our employee referral program pays cash bonuses for hires that come through your introduction.
        Bonus amounts are shown on each job when HR has configured them.
      </p>
      <Link
        to="/referral-portal/jobs"
        className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-white text-violet-900 text-sm font-bold hover:bg-violet-50"
      >
        Browse open roles
      </Link>
    </div>

    <section className="space-y-4">
      <h2 className="font-bold text-lg text-slate-900 dark:text-white">Bonus tiers</h2>
      <ul className="space-y-3">
        {TIERS.map((t) => (
          <li
            key={t.role}
            className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 flex gap-4"
          >
            <CheckCircle2 className="text-violet-600 shrink-0" size={22} />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">{t.role}</p>
              <p className="text-violet-700 dark:text-violet-300 font-black">{t.bonus}</p>
              <p className="text-xs text-slate-500 mt-1">{t.note}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
        <HelpCircle size={20} /> FAQ
      </h2>
      <dl className="space-y-4">
        {FAQ.map((item) => (
          <div
            key={item.q}
            className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5"
          >
            <dt className="font-bold text-slate-900 dark:text-white">{item.q}</dt>
            <dd className="text-sm text-slate-600 dark:text-white/70 mt-2">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>

    <p className="text-xs text-slate-400">
      Program terms are managed by HR. Bonus amounts on job postings override general tiers when shown.
    </p>
  </div>
)

export default ReferralProgram
