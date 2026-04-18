import type {
  WineType, CellarStatus, Clarity, AppearanceIntensity,
  NoseIntensity, Development, Sweetness, Acidity, TanninLevel,
  TanninTexture, Alcohol, Body, Mousse, FlavourIntensity, Finish,
  Quality, Readiness, AromaCategory,
} from '@/lib/ordinalScales'

export interface SelectedAroma {
  tag_id: string
  context: 'nose' | 'palate'
  category: AromaCategory
}

export interface WineFormData {
  // Step 1
  wine_name: string
  producer: string
  region: string
  appellation: string
  varietal: string[]
  vintage: string
  wine_type: WineType | ''
  date_tasted: string
  bottle_photo_url: string
  vivino_url: string
  cellar_status: CellarStatus

  // Step 2
  appearance_clarity: Clarity | ''
  appearance_intensity: AppearanceIntensity | ''
  appearance_color: string

  // Step 3
  nose_condition: 'clean' | 'faulty' | ''
  nose_intensity: NoseIntensity | ''
  nose_development: Development | ''

  // Step 4
  palate_sweetness: Sweetness | ''
  palate_acidity: Acidity | ''
  palate_tannin_level: TanninLevel | ''
  palate_tannin_texture: TanninTexture | ''
  palate_alcohol: Alcohol | ''
  palate_body: Body | ''
  palate_mousse: Mousse | ''
  palate_flavour_intensity: FlavourIntensity | ''
  palate_finish: Finish | ''

  // Step 5
  conclusion_quality: Quality | ''
  conclusion_readiness: Readiness | ''
  overall_rating: number
  price_paid: string
  retail_price: string
  occasion_notes: string

  // Aromas (across steps)
  aromas: SelectedAroma[]
}

export const DEFAULT_FORM: WineFormData = {
  wine_name: '', producer: '', region: '', appellation: '',
  varietal: [], vintage: '', wine_type: '', date_tasted: new Date().toISOString().slice(0, 10),
  bottle_photo_url: '', vivino_url: '', cellar_status: 'tried',
  appearance_clarity: '', appearance_intensity: '', appearance_color: '',
  nose_condition: '', nose_intensity: '', nose_development: '',
  palate_sweetness: '', palate_acidity: '', palate_tannin_level: '',
  palate_tannin_texture: '', palate_alcohol: '', palate_body: '',
  palate_mousse: '', palate_flavour_intensity: '', palate_finish: '',
  conclusion_quality: '', conclusion_readiness: '', overall_rating: 0,
  price_paid: '', retail_price: '', occasion_notes: '',
  aromas: [],
}
