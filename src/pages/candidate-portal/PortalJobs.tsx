import React, { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../services/api'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { matchesAnySearch } from '../../lib/textSearch'
import { EmptyState } from '../../components/ui/EmptyState'
import { PortalApplicationCard } from '../../components/portal/PortalApplicationCard'
import { AnimatedTabNav } from '../../components/motion/AnimatedTabNav'
import { TabContent } from '../../components/motion/TabContent'
import clsx from 'clsx'
import { MapPin, Building2, Briefcase, Hash } from 'lucide-react'

type JobsTab = 'open' | 'applied'

const PortalJobs = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: JobsTab = searchParams.get('tab') === 'applied' ? 'applied' : 'open'
  const [search, setSearch] = useState('')

  const setTab = (next: JobsTab) => {
    setSearchParams(next === 'applied' ? { tab: 'applied' } : {}, { replace: true })
  }

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['portal-positions'],
    queryFn: api.portal.getOpenPositions,
  })

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['portal-applications'],
    queryFn: api.portal.getApplications,
  })

  const { data: portalMe } = useQuery({
    queryKey: ['portal-me'],
    queryFn: api.portal.getMe,
  })

  const applications = applicationsData?.applications ?? []

  const appliedId =
    portalMe?.linked && portalMe.candidate.requirementId
      ? portalMe.candidate.requirementId
      : null

  const filteredJobs = useMemo(() => {
    const q = search.trim()
    if (!q) return jobs
    return jobs.filter((j) =>
      matchesAnySearch([j.title, j.department, j.client, j.location, j.jobCode], q)
    )
  }, [jobs, search])

  const showSearch = tab === 'open'

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Careers</p>
        <h1 className="text-3xl font-black text-slate-900 mt-1">Jobs</h1>
        <p className="text-slate-600 text-sm mt-1">
          Browse open roles and track applications you have submitted.
        </p>
      </header>

      <AnimatedTabNav
        layoutId="portal-jobs-tabs"
        variant="segment"
        className="w-full max-w-md bg-slate-100 border-slate-200 [&_.m3-surface-primary]:!bg-white [&_.m3-surface-primary]:!shadow-sm [&_button[aria-selected=true]]:!text-[#0f3d38]"
        aria-label="Jobs views"
        tabs={[
          {
            id: 'open',
            label: (
              <>
                Open roles
                {jobs.length > 0 && (
                  <span className="ml-1.5 text-xs font-bold opacity-70">({jobs.length})</span>
                )}
              </>
            ),
          },
          {
            id: 'applied',
            label: (
              <>
                Applied
                {applications.length > 0 && (
                  <span className="ml-1.5 text-xs font-bold opacity-70">({applications.length})</span>
                )}
              </>
            ),
          },
        ]}
        activeId={tab}
        onChange={(id) => setTab(id as JobsTab)}
      />

      {showSearch && (
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search open roles by title, department, client, location…"
        />
      )}

      <TabContent activeKey={tab}>
      {tab === 'open' && (
        <>
          {jobsLoading ? (
            <p className="text-slate-500 text-center py-12">Loading positions…</p>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon="work"
              title={search ? 'No matching roles' : 'No open roles'}
              description={
                search
                  ? 'Try a different search term.'
                  : 'New positions will appear here when published.'
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4">
              {filteredJobs.map((job) => {
                const isApplied = appliedId === job.id
                const spots = Math.max(0, job.openings - job.filled)
                return (
                  <li key={job.id}>
                    <Link
                      to={`/portal/jobs/${job.id}`}
                      className={clsx(
                        'block p-5 rounded-2xl border bg-white transition-all hover:shadow-md',
                        isApplied
                          ? 'border-emerald-300 ring-1 ring-emerald-200'
                          : 'border-slate-200 hover:border-[#0f3d38]/25'
                      )}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                        <div className="space-y-2 min-w-0">
                          <p className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Hash size={12} /> {job.jobCode}
                          </p>
                          <h2 className="text-lg font-black text-slate-900">{job.title}</h2>
                          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                            {job.client && (
                              <span className="inline-flex items-center gap-1">
                                <Building2 size={14} /> {job.client}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Briefcase size={14} /> {job.department}
                            </span>
                            {job.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={14} /> {job.location}
                              </span>
                            )}
                          </div>
                          {job.description && (
                            <p className="text-sm text-slate-500 line-clamp-2">{job.description}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-right space-y-2">
                          {isApplied ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                              Applied
                            </span>
                          ) : (
                            <span className="inline-block text-xs font-bold text-[#0f3d38]">
                              View & apply →
                            </span>
                          )}
                          <p className="text-xs text-slate-500">
                            {spots > 0 ? `${spots} opening${spots !== 1 ? 's' : ''}` : 'Apply now'}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      {tab === 'applied' && (
        <>
          <p className="text-sm text-slate-600">
            Roles you have applied for. Positions that are closed, on hold, cancelled, hidden, or
            joined show as <strong>Closed</strong>.
          </p>
          {appsLoading ? (
            <p className="text-slate-500 text-center py-12">Loading applications…</p>
          ) : applications.length === 0 ? (
            <div className="text-center">
              <EmptyState
                icon="assignment"
                title="No applications yet"
                description="Switch to Open roles to find a position and apply."
              />
              <button
                type="button"
                onClick={() => setTab('open')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f3d38] text-white font-bold text-sm"
              >
                Browse open roles
              </button>
            </div>
          ) : (
            <ul className="space-y-6">
              {applications.map((app) => (
                <li key={app.requirementId}>
                  <PortalApplicationCard app={app} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      </TabContent>
    </div>
  )
}

export default PortalJobs
