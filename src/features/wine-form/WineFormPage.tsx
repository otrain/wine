import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useCreateWine, useUpdateWine, useWine, useWineAromas } from '@/lib/hooks/useWines'
import { saveDraft, loadDraft, clearDraft } from '@/lib/syncQueue'
import { Step1_Identity } from './Step1_Identity'
import { Step2_Appearance } from './Step2_Appearance'
import { Step3_Nose } from './Step3_Nose'
import { Step4_Palate } from './Step4_Palate'
import { Step5_Conclusions } from './Step5_Conclusions'
import { DEFAULT_FORM, type WineFormData } from './types'
import type { WineInsert } from '@/lib/database.types'

const STEPS = ['Identity', 'Appearance', 'Nose', 'Palate', 'Conclusions']

function formToInsert(d: WineFormData): WineInsert {
  return {
    wine_name: d.wine_name,
    producer: d.producer || null,
    region: d.region || null,
    appellation: d.appellation || null,
    varietal: d.varietal.length ? d.varietal : null,
    vintage: d.vintage && d.vintage !== 'NV' ? Number(d.vintage) : null,
    wine_type: d.wine_type || 'red',
    date_tasted: d.date_tasted || new Date().toISOString().slice(0, 10),
    occasion_notes: d.occasion_notes || null,
    bottle_photo_url: d.bottle_photo_url || null,
    vivino_url: d.vivino_url || null,
    price_paid: d.price_paid ? Number(d.price_paid) : null,
    retail_price: d.retail_price ? Number(d.retail_price) : null,
    overall_rating: d.overall_rating || 1,
    cellar_status: d.cellar_status || 'tried',
    appearance_clarity: d.appearance_clarity || null,
    appearance_intensity: d.appearance_intensity || null,
    appearance_color: d.appearance_color || null,
    nose_condition: d.nose_condition || null,
    nose_intensity: d.nose_intensity || null,
    nose_development: d.nose_development || null,
    palate_sweetness: d.palate_sweetness || null,
    palate_acidity: d.palate_acidity || null,
    palate_tannin_level: d.palate_tannin_level || null,
    palate_tannin_texture: d.palate_tannin_texture || null,
    palate_alcohol: d.palate_alcohol || null,
    palate_body: d.palate_body || null,
    palate_mousse: d.palate_mousse || null,
    palate_flavour_intensity: d.palate_flavour_intensity || null,
    palate_finish: d.palate_finish || null,
    conclusion_quality: d.conclusion_quality || null,
    conclusion_readiness: d.conclusion_readiness || null,
    client_id: null,
    sync_status: 'synced',
  }
}

interface Props { mode: 'create' | 'edit' }

export function WineFormPage({ mode }: Props) {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<WineFormData>(DEFAULT_FORM)
  const [toast, setToast] = useState('')

  const { data: existingWine } = useWine(mode === 'edit' ? id : undefined)
  const { data: existingAromas = [] } = useWineAromas(mode === 'edit' ? id : undefined)
  const createWine = useCreateWine()
  const updateWine = useUpdateWine()

  const draftKey = mode === 'edit' ? `edit-${id}` : 'new-wine'

  useEffect(() => {
    if (mode === 'edit' && existingWine) {
      setForm({
        ...DEFAULT_FORM,
        wine_name: existingWine.wine_name,
        producer: existingWine.producer ?? '',
        region: existingWine.region ?? '',
        appellation: existingWine.appellation ?? '',
        varietal: existingWine.varietal ?? [],
        vintage: existingWine.vintage?.toString() ?? '',
        wine_type: existingWine.wine_type,
        date_tasted: existingWine.date_tasted,
        occasion_notes: existingWine.occasion_notes ?? '',
        bottle_photo_url: existingWine.bottle_photo_url ?? '',
        vivino_url: existingWine.vivino_url ?? '',
        price_paid: existingWine.price_paid?.toString() ?? '',
        retail_price: existingWine.retail_price?.toString() ?? '',
        overall_rating: existingWine.overall_rating,
        cellar_status: existingWine.cellar_status,
        appearance_clarity: existingWine.appearance_clarity ?? '',
        appearance_intensity: existingWine.appearance_intensity ?? '',
        appearance_color: existingWine.appearance_color ?? '',
        nose_condition: existingWine.nose_condition ?? '',
        nose_intensity: existingWine.nose_intensity ?? '',
        nose_development: existingWine.nose_development ?? '',
        palate_sweetness: existingWine.palate_sweetness ?? '',
        palate_acidity: existingWine.palate_acidity ?? '',
        palate_tannin_level: existingWine.palate_tannin_level ?? '',
        palate_tannin_texture: existingWine.palate_tannin_texture ?? '',
        palate_alcohol: existingWine.palate_alcohol ?? '',
        palate_body: existingWine.palate_body ?? '',
        palate_mousse: existingWine.palate_mousse ?? '',
        palate_flavour_intensity: existingWine.palate_flavour_intensity ?? '',
        palate_finish: existingWine.palate_finish ?? '',
        conclusion_quality: existingWine.conclusion_quality ?? '',
        conclusion_readiness: existingWine.conclusion_readiness ?? '',
        aromas: existingAromas.map((a) => ({
          tag_id: a.tag_id,
          context: a.context,
          category: a.category,
        })),
      })
    } else if (mode === 'create') {
      loadDraft(draftKey).then((draft) => {
        if (draft) setForm((prev) => ({ ...prev, ...(draft as Partial<WineFormData>) }))
      })
    }
  }, [existingWine, existingAromas, mode, draftKey])

  function patch(p: Partial<WineFormData>) {
    setForm((prev) => {
      const next = { ...prev, ...p }
      saveDraft(draftKey, next)
      return next
    })
  }

  async function handleSubmit() {
    if (!form.wine_name.trim()) { setToast('Wine name is required'); return }
    if (!form.overall_rating) { setToast('Overall rating is required'); return }

    try {
      if (mode === 'create') {
        const result = await createWine.mutateAsync({ wine: formToInsert(form), aromas: form.aromas })
        await clearDraft(draftKey)
        if (result) {
          navigate(`/wines/${result.id}`)
        } else {
          setToast('Saved locally — will sync when online')
          navigate('/wines')
        }
      } else if (id) {
        await updateWine.mutateAsync({ id, wine: formToInsert(form), aromas: form.aromas })
        await clearDraft(draftKey)
        navigate(`/wines/${id}`)
      }
    } catch (err) {
      setToast(`Error: ${(err as Error).message}`)
    }
  }

  const isPending = createWine.isPending || updateWine.isPending

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Progress bar */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between mb-2">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setStep(i)}
                className={`text-xs font-medium transition-colors ${i === step ? 'text-rose-400' : i < step ? 'text-zinc-400' : 'text-zinc-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-600 transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-28">
        <div className="max-w-lg mx-auto">
          {step === 0 && <Step1_Identity data={form} onChange={patch} />}
          {step === 1 && <Step2_Appearance data={form} onChange={patch} />}
          {step === 2 && <Step3_Nose data={form} onChange={patch} />}
          {step === 3 && <Step4_Palate data={form} onChange={patch} />}
          {step === 4 && <Step5_Conclusions data={form} onChange={patch} />}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-zinc-800 text-zinc-100 px-4 py-2 rounded-lg text-sm shadow-lg z-50">
          {toast}
          <button onClick={() => setToast('')} className="ml-3 text-zinc-400 hover:text-white">×</button>
        </div>
      )}

      {/* Sticky bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 px-4 py-3 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex gap-3">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-1 px-4 py-3 bg-zinc-800 text-zinc-300 rounded-lg min-h-[44px] hover:bg-zinc-700"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-1 px-6 py-3 bg-rose-700 text-white rounded-lg min-h-[44px] hover:bg-rose-600 font-medium"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="flex items-center gap-1 px-6 py-3 bg-rose-700 text-white rounded-lg min-h-[44px] hover:bg-rose-600 font-medium disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {isPending ? 'Saving…' : 'Save Wine'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
