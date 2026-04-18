import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, SortAsc } from 'lucide-react'
import { useWines, type WineFilters } from '@/lib/hooks/useWines'
import { WineCard } from './WineCard'
import { FilterPanel } from './FilterPanel'

type SortKey = 'date_tasted' | 'overall_rating' | 'price_paid' | 'value_score'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'date_tasted', label: 'Date' },
  { key: 'overall_rating', label: 'Rating' },
  { key: 'price_paid', label: 'Price' },
  { key: 'value_score', label: 'Value' },
]

export function WineListPage() {
  const [filters, setFilters] = useState<WineFilters>({})
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('date_tasted')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const activeFilters = { ...filters, search: search || undefined }
  const { data: wines = [], isLoading, error } = useWines(activeFilters)

  const sorted = [...wines].sort((a, b) => {
    const av = a[sort] ?? -Infinity
    const bv = b[sort] ?? -Infinity
    return sortDir === 'desc' ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1)
  })

  function toggleSort(key: SortKey) {
    if (sort === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSort(key); setSortDir('desc') }
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search wines…"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>
            <Link
              to="/wines/new"
              className="p-2 bg-rose-700 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-rose-600"
            >
              <Plus className="w-5 h-5 text-white" />
            </Link>
          </div>

          <div className="flex gap-1.5 items-center">
            <SortAsc className="w-3.5 h-3.5 text-zinc-500" />
            {SORT_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleSort(key)}
                className={`px-2.5 py-1 text-xs rounded-full font-medium transition-colors ${sort === key ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {label}{sort === key ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">
        <FilterPanel filters={filters} onChange={setFilters} />

        {isLoading && (
          <div className="text-center py-12 text-zinc-500">Loading…</div>
        )}
        {error && (
          <div className="text-center py-12 text-rose-400">Failed to load wines</div>
        )}
        {!isLoading && !error && sorted.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <p className="text-zinc-400">No wines found</p>
            <Link to="/wines/new" className="inline-flex items-center gap-2 px-4 py-2 bg-rose-700 text-white rounded-lg text-sm hover:bg-rose-600">
              <Plus className="w-4 h-4" /> Log your first wine
            </Link>
          </div>
        )}
        {sorted.map((w) => <WineCard key={w.id} wine={w} />)}
      </div>
    </div>
  )
}
