import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts'
import { WINE_TYPE_COLORS } from '@/lib/ordinalScales'
import type { Wine } from '@/lib/database.types'

interface Props {
  wines: Wine[]
  xKey: 'price_paid' | 'retail_price'
  highlightUnder20: boolean
}

interface Dot {
  x: number
  y: number
  name: string
  wine_type: string
  id: string
  value_score: number | null
}

function jitter(n: number, amount = 0.12): number {
  return n + (Math.random() - 0.5) * amount
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: Dot = payload[0].payload
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm shadow-xl max-w-xs">
      <p className="font-medium text-zinc-100">{d.name}</p>
      <p className="text-zinc-400 capitalize">{d.wine_type}</p>
      <p className="text-zinc-300">${d.x.toFixed(2)} · {d.y}★</p>
      {d.value_score != null && <p className="text-blue-400">Value: {d.value_score.toFixed(2)}</p>}
    </div>
  )
}

export function WineScatterplot({ wines, xKey, highlightUnder20 }: Props) {
  const points: Dot[] = wines
    .filter((w) => w[xKey] != null && w.overall_rating != null)
    .map((w) => ({
      x: jitter(w[xKey]!),
      y: jitter(w.overall_rating, 0.08),
      name: w.wine_name,
      wine_type: w.wine_type,
      id: w.id,
      value_score: w.value_score,
    }))

  const unpriced = wines.filter((w) => w[xKey] == null).length

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            type="number"
            dataKey="x"
            name="Price"
            unit="$"
            stroke="#52525b"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
            label={{ value: xKey === 'price_paid' ? 'Price Paid ($)' : 'Retail Price ($)', position: 'insideBottom', offset: -10, fill: '#71717a', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name="Rating"
            domain={[0.5, 5.5]}
            ticks={[1, 2, 3, 4, 5]}
            stroke="#52525b"
            tick={{ fill: '#a1a1aa', fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          {highlightUnder20 && (
            <ReferenceLine x={20} stroke="#16a34a" strokeDasharray="4 4" label={{ value: '$20', fill: '#4ade80', fontSize: 10 }} />
          )}
          <Scatter data={points} fillOpacity={0.75}>
            {points.map((p, idx) => {
              const color = WINE_TYPE_COLORS[p.wine_type as keyof typeof WINE_TYPE_COLORS] ?? '#6b7280'
              const isUnder20 = p.x <= 20
              return (
                <Cell
                  key={idx}
                  fill={color}
                  opacity={highlightUnder20 && !isUnder20 ? 0.3 : 0.8}
                  r={p.value_score != null ? Math.max(5, Math.min(14, p.value_score * 30)) : 6}
                />
              )
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      {unpriced > 0 && (
        <p className="text-xs text-zinc-500 text-center">{unpriced} unpriced {unpriced === 1 ? 'entry' : 'entries'} hidden</p>
      )}
    </div>
  )
}
