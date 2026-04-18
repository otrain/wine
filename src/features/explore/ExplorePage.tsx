import { useState } from 'react'
import { useWines, type WineFilters } from '@/lib/hooks/useWines'
import { WineScatterplot } from './WineScatterplot'
import { InsightPanel } from './InsightPanel'
import { FilterPanel } from '@/features/wine-list/FilterPanel'
import { WINE_TYPE_COLORS } from '@/lib/ordinalScales'

export function ExplorePage() {
  const [filters, setFilters] = useState<WineFilters>({})
  const [xKey, setXKey] = useState<'price_paid' | 'retail_price'>('price_paid')
  const [highlightUnder20, setHighlightUnder20] = useState(true)

  const { data: wines = [], isLoading } = useWines(filters)

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <h1 className="text-lg font-semibold text-zinc-100">Explore</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Scatter controls */}
        <div className="bg-zinc-900 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-200">Price vs Rating</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHighlightUnder20((v) => !v)}
                className={`text-xs px-2.5 py-1 rounded-full transition-colors ${highlightUnder20 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-zinc-800 text-zinc-400'}`}
              >
                ≤$20
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {(['price_paid', 'retail_price'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setXKey(k)}
                className={`flex-1 py-1.5 text-xs rounded-md font-medium transition-colors ${xKey === k ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
              >
                {k === 'price_paid' ? 'Price Paid' : 'Retail Price'}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center text-zinc-500">Loading…</div>
          ) : (
            <WineScatterplot wines={wines} xKey={xKey} highlightUnder20={highlightUnder20} />
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 pt-1">
            {Object.entries(WINE_TYPE_COLORS).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-zinc-400 capitalize">{type}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-600">Bubble size = value score. Jitter applied for readability.</p>
        </div>

        <FilterPanel filters={filters} onChange={setFilters} />

        <InsightPanel wines={wines} />
      </div>
    </div>
  )
}
