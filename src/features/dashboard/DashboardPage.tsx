import { Link } from 'react-router-dom'
import { Plus, Star, TrendingUp, Wine, Award } from 'lucide-react'
import { useWines } from '@/lib/hooks/useWines'
import { WineCard } from '@/features/wine-list/WineCard'
import type { Wine as WineRow } from '@/lib/database.types'

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4 flex flex-col gap-1">
      <p className="text-xs text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-zinc-100">{value}</p>
      {sub && <p className="text-xs text-zinc-500">{sub}</p>}
    </div>
  )
}

function avg(nums: (number | null | undefined)[]): number {
  const valid = nums.filter((n): n is number => n != null)
  if (!valid.length) return 0
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

export function DashboardPage() {
  const { data: allWines = [], isLoading } = useWines()

  const totalBottles = allWines.length
  const avgRating = avg(allWines.map((w) => w.overall_rating))
  const avgPrice = avg(allWines.map((w) => w.price_paid))

  const recent = allWines.slice(0, 5)

  const bestValue: WineRow | null = allWines
    .filter((w) => w.price_paid != null && w.price_paid <= 20 && w.value_score != null)
    .sort((a, b) => (b.value_score ?? 0) - (a.value_score ?? 0))[0] ?? null

  const topRated: WineRow | null = [...allWines].sort((a, b) => b.overall_rating - a.overall_rating)[0] ?? null

  const cellarCount = allWines.filter((w) => w.cellar_status === 'in-my-cellar').length
  const wantToTry = allWines.filter((w) => w.cellar_status === 'want-to-try').length

  if (isLoading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading…</div>
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-24">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wine className="w-6 h-6 text-rose-500" />
            <h1 className="text-lg font-bold text-zinc-100">Wine Tracker</h1>
          </div>
          <Link
            to="/wines/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 text-white rounded-lg text-sm font-medium hover:bg-rose-600 min-h-[44px]"
          >
            <Plus className="w-4 h-4" /> Log Wine
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Wines" value={totalBottles} />
          <StatCard label="Avg Rating" value={avgRating ? `${avgRating.toFixed(1)}★` : '—'} />
          <StatCard label="Avg Price" value={avgPrice ? `$${avgPrice.toFixed(0)}` : '—'} />
        </div>

        {/* Insight cards */}
        {(bestValue || topRated) && (
          <div className="grid grid-cols-2 gap-3">
            {bestValue && (
              <Link to={`/wines/${bestValue.id}`} className="bg-zinc-900 rounded-xl p-3 hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-1.5 mb-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <p className="text-xs font-medium text-emerald-400">Best Value ≤$20</p>
                </div>
                <p className="text-sm font-medium text-zinc-100 line-clamp-2">{bestValue.wine_name}</p>
                <p className="text-xs text-zinc-400 mt-1">${bestValue.price_paid?.toFixed(2)} · {bestValue.value_score?.toFixed(2)} val/$</p>
              </Link>
            )}
            {topRated && (
              <Link to={`/wines/${topRated.id}`} className="bg-zinc-900 rounded-xl p-3 hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-1.5 mb-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <p className="text-xs font-medium text-amber-400">Top Rated</p>
                </div>
                <p className="text-sm font-medium text-zinc-100 line-clamp-2">{topRated.wine_name}</p>
                <div className="flex mt-1">
                  {Array.from({ length: topRated.overall_rating }, (_, i) => (
                    <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Cellar summary */}
        {(cellarCount > 0 || wantToTry > 0) && (
          <div className="bg-zinc-900 rounded-xl p-4 flex justify-around text-center">
            <div>
              <p className="text-xl font-bold text-blue-400">{cellarCount}</p>
              <p className="text-xs text-zinc-500 mt-0.5">In Cellar</p>
            </div>
            <div className="w-px bg-zinc-800" />
            <div>
              <p className="text-xl font-bold text-amber-400">{wantToTry}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Want to Try</p>
            </div>
            <div className="w-px bg-zinc-800" />
            <div>
              <p className="text-xl font-bold text-zinc-100">{totalBottles - cellarCount - wantToTry}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Tried</p>
            </div>
          </div>
        )}

        {/* Recent wines */}
        {recent.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4" /> Recent
              </h2>
              <Link to="/wines" className="text-xs text-rose-400 hover:text-rose-300">See all</Link>
            </div>
            {recent.map((w) => <WineCard key={w.id} wine={w} />)}
          </div>
        )}

        {allWines.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <Wine className="w-16 h-16 text-zinc-700 mx-auto" />
            <p className="text-zinc-400 text-lg font-medium">Start your wine journal</p>
            <p className="text-zinc-600 text-sm max-w-xs mx-auto">Log tastings using the WSET SAT framework and discover your best value wines under $20.</p>
            <Link
              to="/wines/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-rose-700 text-white rounded-xl text-sm font-medium hover:bg-rose-600"
            >
              <Plus className="w-4 h-4" /> Log your first wine
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
