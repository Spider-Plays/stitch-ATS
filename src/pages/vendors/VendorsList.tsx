import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Store, Briefcase, Upload, Ban, CheckCircle2 } from 'lucide-react'
import { api } from '../../services/api'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { PageHeader } from '../../components/layout/PageHeader'
import { heroBtnPrimary } from '../../components/layout/PageHero'
import { EmptyState } from '../../components/ui/EmptyState'
import { matchesAnySearch } from '../../lib/textSearch'
import { ApiError } from '../../lib/apiClient'
import { InterviewStatCard } from '../../components/interviews/InterviewStatCard'
import { VendorListItem } from '../../components/vendors/VendorListItem'
import { AnimatedTabNav } from '../../components/motion/AnimatedTabNav'
import {
  VENDOR_FILTERS,
  filterVendors,
  groupVendorsByStatus,
  sortVendors,
  topSubmittingVendors,
  vendorSearchFields,
  vendorStats,
  type VendorFilter,
} from '../../lib/vendorPage'
import type { Vendor } from '../../types'

const VendorsList = () => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<VendorFilter>('ALL')

  const { data: vendors = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['vendors'],
    queryFn: api.vendors.list,
  })

  const searched = useMemo(
    () => vendors.filter((v) => matchesAnySearch(vendorSearchFields(v), searchTerm)),
    [vendors, searchTerm]
  )

  const stats = useMemo(() => vendorStats(searched), [searched])
  const filtered = useMemo(
    () => sortVendors(filterVendors(searched, statusFilter)),
    [searched, statusFilter]
  )

  const topSubmitters = useMemo(() => topSubmittingVendors(searched), [searched])
  const showTopSpotlight =
    statusFilter === 'ALL' && !searchTerm.trim() && topSubmitters.length > 0

  const groupedWhenAll = useMemo(() => {
    if (statusFilter !== 'ALL' || searchTerm.trim()) return null
    const groups = groupVendorsByStatus(filtered)
    if (showTopSpotlight) {
      const spotlightIds = new Set(topSubmitters.map((v) => v.id))
      return groups
        .map((g) => ({
          ...g,
          items: g.items.filter((v) => !spotlightIds.has(v.id)),
        }))
        .filter((g) => g.items.length > 0)
    }
    return groups
  }, [statusFilter, searchTerm, filtered, showTopSpotlight, topSubmitters])

  const setFilter = (id: VendorFilter) => setStatusFilter(id)

  const vendorMenuItems = (vendor: Vendor) => [
    {
      id: 'view',
      label: 'View profile',
      onClick: () => navigate(`/vendors/${vendor.id}`),
    },
    {
      id: 'jobs',
      label: 'Manage jobs',
      onClick: () => navigate(`/vendors/${vendor.id}?tab=jobs`),
    },
    {
      id: 'invite',
      label: 'Invite portal user',
      hidden: vendor.status !== 'ACTIVE',
      onClick: () => navigate(`/vendors/${vendor.id}?tab=users`),
    },
    {
      id: 'submissions',
      label: 'View submissions',
      hidden: (vendor.submissionCount ?? 0) === 0,
      onClick: () => navigate(`/vendors/${vendor.id}?tab=submissions`),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <PageHeader
        highlighted
        icon={Store}
        eyebrow="Staffing partners"
        title="Vendors"
        description="Manage staffing vendors, assign open roles, and control portal access for external submissions."
        actions={
          <Link to="/vendors/new" className={heroBtnPrimary}>
            <Plus size={18} />
            Add vendor
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <InterviewStatCard
          label="All vendors"
          value={stats.total}
          icon={Store}
          accent="slate"
          active={statusFilter === 'ALL'}
          onClick={() => setFilter('ALL')}
        />
        <InterviewStatCard
          label="Active"
          value={stats.active}
          icon={CheckCircle2}
          accent="green"
          active={statusFilter === 'ACTIVE'}
          onClick={() => setFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')}
        />
        <InterviewStatCard
          label="Inactive"
          value={stats.inactive}
          icon={Briefcase}
          accent="slate"
          active={statusFilter === 'INACTIVE'}
          onClick={() => setFilter(statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE')}
        />
        <InterviewStatCard
          label="Suspended"
          value={stats.suspended}
          icon={Ban}
          accent="amber"
          active={statusFilter === 'SUSPENDED'}
          onClick={() => setFilter(statusFilter === 'SUSPENDED' ? 'ALL' : 'SUSPENDED')}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-4 p-4 app-card">
          <div className="p-2.5 rounded-xl bg-primary/10 dark:bg-white/10 text-primary dark:text-white">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-primary dark:text-white">
              {stats.withAssignments}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-primary/50 dark:text-white/50">
              With assigned jobs
            </p>
          </div>
        </div>
        <div className="stat-spotlight border-emerald-200/60 dark:border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10">
          <div className="p-2.5 rounded-xl bg-card shadow-sm text-emerald-700 dark:text-emerald-300">
            <Upload size={20} />
          </div>
          <div>
            <p className="text-2xl font-black tabular-nums text-primary dark:text-white">
              {stats.totalSubmissions}
            </p>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-800/70 dark:text-emerald-300/80">
              Total submissions ({stats.withSubmissions} vendors)
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="panel-toolbar flex-1">
          <ListSearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search name, code, email, contact..."
            className="max-w-none"
          />
        </div>
        <AnimatedTabNav
          layoutId="vendors-list-filters"
          variant="pill"
          uppercase
          aria-label="Filter vendors"
          tabs={VENDOR_FILTERS.map((tab) => ({ id: tab.id, label: tab.label }))}
          activeId={statusFilter}
          onChange={(id) => setStatusFilter(id as VendorFilter)}
        />
      </div>

      {isLoading ? (
        <div className="py-24 text-center text-muted-foreground font-medium">
          Loading vendors...
        </div>
      ) : isError ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-red-200/60 dark:border-red-500/30 p-8 text-center space-y-4">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">
            {error instanceof ApiError
              ? error.status === 404
                ? 'Vendor API is unavailable. Restart the API server (npm run dev:server).'
                : error.message
              : 'Could not load vendors.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
          >
            Try again
          </button>
        </div>
      ) : searched.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-primary/15 dark:border-white/15">
          <EmptyState
            icon="storefront"
            title={searchTerm.trim() ? 'No matches' : 'No vendors yet'}
            description={
              searchTerm.trim()
                ? 'Try a different search or clear filters.'
                : 'Add your first staffing vendor to assign jobs and enable portal submissions.'
            }
          />
          {!searchTerm.trim() && (
            <div className="pb-10 flex justify-center">
              <Link
                to="/vendors/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                <Plus size={16} /> Add vendor
              </Link>
            </div>
          )}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-dashed border-primary/10 dark:border-white/10">
          <EmptyState
            icon="filter_list"
            title="Nothing in this view"
            description="Try another filter or search term."
          />
        </div>
      ) : (
        <div className="space-y-10">
          {showTopSpotlight && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <Upload size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-primary dark:text-white">
                    Active submitters
                  </h2>
                  <p className="text-xs font-medium text-primary/50 dark:text-white/50">
                    Vendors with the most candidate submissions
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {topSubmitters.map((vendor) => (
                  <VendorListItem
                    key={vendor.id}
                    vendor={vendor}
                    menuItems={vendorMenuItems(vendor)}
                    variant="highlight"
                  />
                ))}
              </div>
            </section>
          )}

          {groupedWhenAll && groupedWhenAll.length > 0 ? (
            groupedWhenAll.map((group) => (
              <section key={group.key} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-primary dark:text-white">{group.title}</h2>
                  <span className="text-xs font-bold text-muted-foreground tabular-nums">
                    {group.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {group.items.map((vendor) => (
                    <VendorListItem
                      key={vendor.id}
                      vendor={vendor}
                      menuItems={vendorMenuItems(vendor)}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <section className="space-y-3">
              {filtered.map((vendor) => (
                <VendorListItem
                  key={vendor.id}
                  vendor={vendor}
                  menuItems={vendorMenuItems(vendor)}
                  variant={
                    topSubmitters.some((t) => t.id === vendor.id) ? 'highlight' : 'default'
                  }
                />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default VendorsList
