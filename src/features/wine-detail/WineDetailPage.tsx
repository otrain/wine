import { useNavigate, useParams, Link } from 'react-router-dom'
import { Star, Edit, Trash2, ExternalLink, ArrowLeft, Wine } from 'lucide-react'
import { useWine, useWineAromas, useDeleteWine } from '@/lib/hooks/useWines'
import { WINE_TYPE_COLORS, QUALITY_LABELS, type Quality } from '@/lib/ordinalScales'

function SATRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null
  return (
    <div className="flex justify-between py-1.5 border-b border-zinc-800 last:border-0">
      <span className="text-sm text-zinc-400">{label}</span>
      <span className="text-sm text-zinc-200 capitalize font-medium">{value.replace(/-/g, ' ')}</span>
    </div>
  )
}

function SATSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">{title}</h3>
      {children}
    </div>
  )
}

export function WineDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: wine, isLoading } = useWine(id)
  const { data: aromas = [] } = useWineAromas(id)
  const deleteWine = useDeleteWine()

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">Loading…</div>
  if (!wine) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">Wine not found</div>

  const typeColor = WINE_TYPE_COLORS[wine.wine_type] ?? '#6b7280'
  const noseAromas = aromas.filter((a) => a.context === 'nose')
  const palateAromas = aromas.filter((a) => a.context === 'palate')

  async function handleDelete() {
    if (!window.confirm('Delete this wine?')) return
    await deleteWine.mutateAsync(wine!.id)
    navigate('/wines')
  }

  const vivinoSearchUrl = `https://www.vivino.com/search/wines?q=${encodeURIComponent([wine.wine_name, wine.vintage].filter(Boolean).join(' '))}`
  const totalWineUrl = `https://www.totalwine.com/search/all?text=${encodeURIComponent(wine.wine_name)}`

  return (
    <div className="min-h-screen bg-zinc-950 pb-20">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} className="p-1 text-zinc-400 hover:text-zinc-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-zinc-100 truncate">{wine.wine_name}</h1>
            {wine.producer && <p className="text-sm text-zinc-400 truncate">{wine.producer}</p>}
          </div>
          <Link to={`/wines/${id}/edit`} className="p-2 text-zinc-400 hover:text-zinc-200 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Edit className="w-5 h-5" />
          </Link>
          <button type="button" onClick={handleDelete} className="p-2 text-zinc-600 hover:text-rose-400 min-h-[44px] min-w-[44px] flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Hero */}
        <div className="bg-zinc-900 rounded-xl p-4 flex gap-4">
          {wine.bottle_photo_url ? (
            <img src={wine.bottle_photo_url} alt={wine.wine_name} className="w-20 h-28 object-cover rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-20 h-28 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${typeColor}20` }}>
              <Wine className="w-10 h-10" style={{ color: typeColor }} />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: wine.overall_rating }, (_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span
              className="inline-block px-2 py-0.5 rounded text-xs font-medium capitalize"
              style={{ backgroundColor: `${typeColor}20`, color: typeColor }}
            >
              {wine.wine_type}
            </span>
            <div className="text-sm space-y-0.5">
              {wine.region && <p className="text-zinc-300">{wine.region}{wine.appellation ? ` · ${wine.appellation}` : ''}</p>}
              {wine.vintage && <p className="text-zinc-400">{wine.vintage}</p>}
              {wine.varietal?.length ? <p className="text-zinc-500 text-xs">{wine.varietal.join(', ')}</p> : null}
            </div>
            <div className="flex gap-3">
              {wine.price_paid != null && (
                <div>
                  <p className="text-xs text-zinc-500">Paid</p>
                  <p className="text-sm font-semibold text-emerald-400">${wine.price_paid.toFixed(2)}</p>
                </div>
              )}
              {wine.retail_price != null && (
                <div>
                  <p className="text-xs text-zinc-500">Retail</p>
                  <p className="text-sm font-medium text-zinc-300">${wine.retail_price.toFixed(2)}</p>
                </div>
              )}
              {wine.value_score != null && (
                <div>
                  <p className="text-xs text-zinc-500">Value</p>
                  <p className="text-sm font-medium text-blue-400">{wine.value_score.toFixed(2)}</p>
                </div>
              )}
              {wine.deal_delta != null && wine.deal_delta > 0 && (
                <div>
                  <p className="text-xs text-zinc-500">Deal</p>
                  <p className="text-sm font-medium text-purple-400">+${wine.deal_delta.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tasted */}
        <p className="text-xs text-zinc-500 text-center">
          Tasted {new Date(wine.date_tasted).toLocaleDateString('en-US', { dateStyle: 'long' })}
          {wine.cellar_status !== 'tried' && ` · ${wine.cellar_status.replace(/-/g, ' ')}`}
        </p>

        {/* SAT — Appearance */}
        <SATSection title="Appearance">
          <SATRow label="Clarity" value={wine.appearance_clarity} />
          <SATRow label="Intensity" value={wine.appearance_intensity} />
          <SATRow label="Color" value={wine.appearance_color} />
        </SATSection>

        {/* SAT — Nose */}
        <SATSection title="Nose">
          <SATRow label="Condition" value={wine.nose_condition} />
          <SATRow label="Intensity" value={wine.nose_intensity} />
          <SATRow label="Development" value={wine.nose_development} />
          {noseAromas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {noseAromas.map((a) => (
                <span key={a.id} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full text-xs">
                  {a.aroma_tags?.name ?? a.tag_id}
                </span>
              ))}
            </div>
          )}
        </SATSection>

        {/* SAT — Palate */}
        <SATSection title="Palate">
          <SATRow label="Sweetness" value={wine.palate_sweetness} />
          <SATRow label="Acidity" value={wine.palate_acidity} />
          <SATRow label="Tannin Level" value={wine.palate_tannin_level} />
          <SATRow label="Tannin Texture" value={wine.palate_tannin_texture} />
          <SATRow label="Alcohol" value={wine.palate_alcohol} />
          <SATRow label="Body" value={wine.palate_body} />
          <SATRow label="Mousse" value={wine.palate_mousse} />
          <SATRow label="Flavour Intensity" value={wine.palate_flavour_intensity} />
          <SATRow label="Finish" value={wine.palate_finish} />
          {palateAromas.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {palateAromas.map((a) => (
                <span key={a.id} className="px-2 py-0.5 bg-zinc-800 text-zinc-300 rounded-full text-xs">
                  {a.aroma_tags?.name ?? a.tag_id}
                </span>
              ))}
            </div>
          )}
        </SATSection>

        {/* Conclusions */}
        <SATSection title="Conclusions">
          {wine.conclusion_quality && (
            <SATRow label="Quality" value={QUALITY_LABELS[wine.conclusion_quality as Quality]} />
          )}
          <SATRow label="Readiness" value={wine.conclusion_readiness?.replace(/-/g, ' ')} />
        </SATSection>

        {/* Occasion notes */}
        {wine.occasion_notes && (
          <div className="bg-zinc-900 rounded-xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Notes</h3>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{wine.occasion_notes}</p>
          </div>
        )}

        {/* Check Price links */}
        <div className="bg-zinc-900 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 mb-2">Check Price</h3>
          {wine.vivino_url ? (
            <a href={wine.vivino_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              <ExternalLink className="w-4 h-4" /> Vivino
            </a>
          ) : (
            <a href={vivinoSearchUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
              <ExternalLink className="w-4 h-4" /> Search Vivino
            </a>
          )}
          <a href={totalWineUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300">
            <ExternalLink className="w-4 h-4" /> Search Total Wine
          </a>
        </div>
      </div>
    </div>
  )
}
