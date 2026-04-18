import { Link } from 'react-router-dom'
import { Star, TrendingUp, Award } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { Wine } from '@/lib/database.types'

interface Props { wines: Wine[] }

const BANDS = [
  { label: '<$10',   min: 0,  max: 10 },
  { label: '$10–15', min: 10, max: 15 },
  { label: '$15–20', min: 15, max: 20 },
  { label: '$20–25', min: 20, max: 25 },
  { label: '$25–30', min: 25, max: 30 },
  { label: '$30–40', min: 30, max: 40 },
  { label: '$40+',   min: 40, max: Infinity },
]

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function stddev(nums: number[]): number {
  if (nums.length < 2) return 0
  const mean = avg(nums)
  return Math.sqrt(nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length)
}

export function InsightPanel({ wines }: Props) {
  const priced = wines.filter((w) => w.price_paid != null && w.price_paid > 0)

  // Price band chart
  const bandData = BANDS.map((b) => {
    const inBand = priced.filter((w) => w.price_paid! >= b.min && w.price_paid! < b.max)
    return { name: b.label, avg: avg(inBand.map((w) => w.overall_rating)), count: inBand.length }
  }).filter((b) => b.count > 0)

  // Best value (under $20)
  const bestValue = [...priced]
    .filter((w) => w.price_paid! <= 20 && w.value_score != null)
    .sort((a, b) => (b.value_score ?? 0) - (a.value_score ?? 0))
    .slice(0, 5)

  // Reliable producers (≥3 entries)
  const byProducer = new Map<string, Wine[]>()
  for (const w of priced) {
    if (!w.producer) continue
    const arr = byProducer.get(w.producer) ?? []
    arr.push(w)
    byProducer.set(w.producer, arr)
  }
  const reliableProducers = [...byProducer.entries()]
    .filter(([, ws]) => ws.length >= 3)
    .map(([producer, ws]) => ({
      producer,
      avgValue: avg(ws.map((w) => w.value_score ?? 0)),
      stddevRating: stddev(ws.map((w) => w.overall_rating)),
      count: ws.length,
    }))
    .sort((a, b) => b.avgValue - a.avgValue)
    .slice(0, 5)

  // Best deals (deal_delta DESC)
  const bestDeals = [...wines]
    .filter((w) => w.deal_delta != null && w.deal_delta > 0)
    .sort((a, b) => (b.deal_delta ?? 0) - (a.deal_delta ?? 0))
    .slice(0, 5)

  // Try next
  const tryNext = wines.filter((w) => w.cellar_status === 'want-to-try').slice(0, 5)

  return (
    <div className="space-y-5">
      {/* Price Band Chart */}
      {bandData.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-rose-400" /> Avg Rating by Price Band
          </h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={bandData} margin={{ left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fill: '#a1a1aa', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
                formatter={(v: unknown) => [(v as number).toFixed(2), 'Avg Rating']}
              />
              <Bar dataKey="avg" fill="#b91c1c" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Best Value Under $20 */}
      {bestValue.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" /> Best Value Under $20
          </h3>
          <div className="space-y-2">
            {bestValue.map((w) => (
              <Link key={w.id} to={`/wines/${w.id}`} className="flex items-center justify-between hover:bg-zinc-800 rounded-lg px-2 py-1.5 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{w.wine_name}</p>
                  <p className="text-xs text-zinc-500">${w.price_paid?.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <div className="flex">
                    {Array.from({ length: w.overall_rating }, (_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-blue-400">{w.value_score?.toFixed(2)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Reliable Producers */}
      {reliableProducers.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Reliable Value Producers</h3>
          <div className="space-y-2">
            {reliableProducers.map((p) => (
              <div key={p.producer} className="flex items-center justify-between px-2 py-1.5">
                <div>
                  <p className="text-sm text-zinc-200">{p.producer}</p>
                  <p className="text-xs text-zinc-500">{p.count} wines · σ {p.stddevRating.toFixed(2)}</p>
                </div>
                <span className="text-sm text-blue-400 font-medium">{p.avgValue.toFixed(2)} val/$</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Deals */}
      {bestDeals.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Best Deals Found</h3>
          <div className="space-y-2">
            {bestDeals.map((w) => (
              <Link key={w.id} to={`/wines/${w.id}`} className="flex items-center justify-between hover:bg-zinc-800 rounded-lg px-2 py-1.5 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm text-zinc-200 truncate">{w.wine_name}</p>
                  <p className="text-xs text-zinc-500">${w.price_paid?.toFixed(2)} paid · ${w.retail_price?.toFixed(2)} retail</p>
                </div>
                <span className="text-sm text-purple-400 font-medium flex-shrink-0 ml-2">+${w.deal_delta?.toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Try Next */}
      {tryNext.length > 0 && (
        <div className="bg-zinc-900 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-zinc-200 mb-3">Want to Try</h3>
          <div className="space-y-1.5">
            {tryNext.map((w) => (
              <Link key={w.id} to={`/wines/${w.id}`} className="flex items-center gap-2 hover:bg-zinc-800 rounded-lg px-2 py-1.5 transition-colors">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <p className="text-sm text-zinc-200 truncate">{w.wine_name}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
