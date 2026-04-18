import { Link } from 'react-router-dom'
import { Star, Wine } from 'lucide-react'
import { WINE_TYPE_COLORS } from '@/lib/ordinalScales'
import type { Wine as WineRow } from '@/lib/database.types'

interface Props { wine: WineRow }

export function WineCard({ wine }: Props) {
  const color = WINE_TYPE_COLORS[wine.wine_type] ?? '#6b7280'

  return (
    <Link
      to={`/wines/${wine.id}`}
      className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3 hover:bg-zinc-800 transition-colors"
    >
      {wine.bottle_photo_url ? (
        <img src={wine.bottle_photo_url} alt={wine.wine_name} className="w-12 h-16 object-cover rounded-lg flex-shrink-0" />
      ) : (
        <div className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Wine className="w-6 h-6" style={{ color }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-zinc-100 truncate">{wine.wine_name}</p>
            {wine.producer && <p className="text-sm text-zinc-400 truncate">{wine.producer}</p>}
            <p className="text-xs text-zinc-500 mt-0.5">
              {[wine.region, wine.vintage].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: wine.overall_rating }, (_, i) => (
                <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            {wine.price_paid != null && (
              <span className="text-xs font-medium text-emerald-400">${wine.price_paid.toFixed(2)}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="inline-block px-1.5 py-0.5 rounded text-xs font-medium capitalize"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {wine.wine_type}
          </span>
          {wine.value_score != null && (
            <span className="text-xs text-zinc-500">
              {wine.value_score.toFixed(2)} val/$
            </span>
          )}
          {wine.cellar_status === 'in-my-cellar' && (
            <span className="text-xs text-blue-400">In cellar</span>
          )}
        </div>
      </div>
    </Link>
  )
}
