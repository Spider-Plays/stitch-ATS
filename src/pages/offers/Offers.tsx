import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Clock, ArrowRight, FileText } from 'lucide-react'
import { api } from '../../services/api'
import clsx from 'clsx'
import { ListSearchBar } from '../../components/ui/ListSearchBar'
import { matchesAnySearch } from '../../lib/textSearch'

const Offers = () => {
    const [searchTerm, setSearchTerm] = useState('')

    const { data: offers = [], isLoading } = useQuery({
        queryKey: ['offers'],
        queryFn: api.offers.list
    })

    const { data: candidates = [] } = useQuery({ queryKey: ['candidates'], queryFn: api.candidates.list })
    const { data: requirements = [] } = useQuery({ queryKey: ['requirements'], queryFn: api.requirements.list })

    const getCandidate = (id: string) => candidates.find(c => c.id === id)
    const getRequirement = (id: string) => requirements.find(r => r.id === id)

    const filteredOffers = useMemo(() => {
        return offers.filter((offer) => {
            const candidate = getCandidate(offer.candidateId)
            const requirement = getRequirement(offer.requirementId)
            return matchesAnySearch(
                [
                    candidate?.name,
                    candidate?.email,
                    candidate?.role,
                    requirement?.title,
                    requirement?.department,
                    offer.status,
                    offer.baseSalary,
                ],
                searchTerm
            )
        })
    }, [offers, candidates, requirements, searchTerm])

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DRAFT': return 'bg-slate-100 text-slate-600 border-slate-200'
            case 'APPROVAL_PENDING': return 'bg-amber-100 text-amber-700 border-amber-200'
            case 'APPROVED': return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'SENT': return 'bg-purple-100 text-purple-700 border-purple-200'
            case 'NEGOTIATION': return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'ACCEPTED': return 'bg-green-100 text-green-700 border-green-200'
            case 'DECLINED': return 'bg-red-100 text-red-700 border-red-200'
            case 'WITHDRAWN': return 'bg-gray-100 text-gray-700 border-gray-200'
            default: return 'bg-slate-100 text-slate-600'
        }
    }

    if (isLoading) return <div className="p-8 text-center">Loading offers...</div>

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-primary dark:text-white tracking-tight">Offers</h1>
                    <p className="text-primary/60 dark:text-white/60 font-medium mt-1">Manage candidate offers and negotiations.</p>
                </div>
                <Link to="/offers/new">
                    <button className="flex items-center gap-2 px-6 py-3 bg-primary dark:bg-white text-white dark:text-primary rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 dark:shadow-none">
                        <Plus size={18} />
                        <span>Create Offer</span>
                    </button>
                </Link>
            </div>

            <div className="bg-white dark:bg-white/5 p-4 rounded-2xl border border-primary/10 dark:border-white/10 shadow-sm">
                <ListSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by candidate, job, or offer status..."
                    className="max-w-none"
                />
            </div>

            {/* Offers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOffers.map(offer => {
                    const candidate = getCandidate(offer.candidateId)
                    return (
                        <Link key={offer.id} to={`/offers/${offer.id}`} className="group relative bg-white dark:bg-white/5 rounded-2xl border border-primary/10 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 block">
                            <div className="flex justify-between items-start mb-4">
                                <div className="size-12 rounded-xl bg-primary/5 dark:bg-white/10 flex items-center justify-center text-primary dark:text-white font-bold text-lg">
                                    {candidate?.name?.charAt(0) || '?'}
                                </div>
                                <span className={clsx("px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border", getStatusColor(offer.status))}>
                                    {offer.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="font-bold text-lg text-primary dark:text-white group-hover:text-amber-500 transition-colors">{candidate?.name || 'Unknown Candidate'}</h3>
                                <p className="text-sm font-medium text-primary/60 dark:text-white/60">{candidate?.role || 'Role'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-t border-primary/5 dark:border-white/5 mb-4">
                                <div>
                                    <p className="text-[10px] font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">Salaire Base</p>
                                    <p className="font-bold text-primary dark:text-white">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumSignificantDigits: 3 }).format(offer.baseSalary)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-primary/40 dark:text-white/40 uppercase tracking-wider mb-1">Equity</p>
                                    <p className="font-bold text-primary dark:text-white">{offer.equity ? offer.equity.toLocaleString() : '-'}</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-xs font-bold text-primary/40 dark:text-white/40">
                                <span className="flex items-center gap-1">
                                    <Clock size={14} /> {new Date(offer.createdAt).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-primary/60 dark:text-white/60">
                                    View Details <ArrowRight size={14} />
                                </span>
                            </div>
                        </Link>
                    )
                })}
                {filteredOffers.length === 0 && (
                    <div className="col-span-full p-12 text-center bg-primary/[0.02] dark:bg-white/[0.02] rounded-2xl border border-dashed border-primary/10 dark:border-white/10">
                        <div className="size-16 mx-auto bg-primary/5 dark:bg-white/5 rounded-full flex items-center justify-center text-primary/40 dark:text-white/40 mb-4">
                            <FileText size={32} />
                        </div>
                        <h3 className="font-bold text-primary dark:text-white text-lg">
                            {searchTerm.trim() ? 'No offers match your search' : 'No offers yet'}
                        </h3>
                        <p className="text-primary/40 dark:text-white/40 font-medium">
                            {searchTerm.trim()
                                ? 'Try a different name, job title, or status.'
                                : 'Create your first offer to get started.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Offers
