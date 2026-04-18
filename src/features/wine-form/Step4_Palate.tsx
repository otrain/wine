import { OrdinalSelector } from '@/components/OrdinalSelector'
import {
  SWEETNESS, ACIDITY, TANNIN_LEVEL, TANNIN_TEXTURE,
  ALCOHOL, BODY, MOUSSE, FLAVOUR_INTENSITY, FINISH,
} from '@/lib/ordinalScales'
import { AromaTagPicker } from './AromaTagPicker'
import type { WineFormData } from './types'

interface Props {
  data: WineFormData
  onChange: (patch: Partial<WineFormData>) => void
}

export function Step4_Palate({ data, onChange }: Props) {
  const isRed = data.wine_type === 'red' || data.wine_type === 'fortified'
  const isSparkling = data.wine_type === 'sparkling'

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-zinc-100">Palate</h2>

      <OrdinalSelector label="Sweetness" options={SWEETNESS} value={data.palate_sweetness}
        onChange={(v) => onChange({ palate_sweetness: v as WineFormData['palate_sweetness'] })} />

      <OrdinalSelector label="Acidity" options={ACIDITY} value={data.palate_acidity}
        onChange={(v) => onChange({ palate_acidity: v as WineFormData['palate_acidity'] })} />

      {isRed && (
        <>
          <OrdinalSelector label="Tannin Level" options={TANNIN_LEVEL} value={data.palate_tannin_level}
            onChange={(v) => onChange({ palate_tannin_level: v as WineFormData['palate_tannin_level'] })} />
          <OrdinalSelector label="Tannin Texture" options={TANNIN_TEXTURE} value={data.palate_tannin_texture}
            onChange={(v) => onChange({ palate_tannin_texture: v as WineFormData['palate_tannin_texture'] })} />
        </>
      )}

      <OrdinalSelector label="Alcohol" options={ALCOHOL} value={data.palate_alcohol}
        onChange={(v) => onChange({ palate_alcohol: v as WineFormData['palate_alcohol'] })} />

      <OrdinalSelector label="Body" options={BODY} value={data.palate_body}
        onChange={(v) => onChange({ palate_body: v as WineFormData['palate_body'] })} />

      {isSparkling && (
        <OrdinalSelector label="Mousse" options={MOUSSE} value={data.palate_mousse}
          onChange={(v) => onChange({ palate_mousse: v as WineFormData['palate_mousse'] })} />
      )}

      <OrdinalSelector label="Flavour Intensity" options={FLAVOUR_INTENSITY} value={data.palate_flavour_intensity}
        onChange={(v) => onChange({ palate_flavour_intensity: v as WineFormData['palate_flavour_intensity'] })} />

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-zinc-300">Flavour Notes (Palate)</label>
        <AromaTagPicker context="palate" selected={data.aromas} onChange={(aromas) => onChange({ aromas })} />
      </div>

      <OrdinalSelector label="Finish" options={FINISH} value={data.palate_finish}
        onChange={(v) => onChange({ palate_finish: v as WineFormData['palate_finish'] })} />
    </div>
  )
}
