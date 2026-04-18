import type {
  Acidity, Alcohol, AppearanceIntensity, Body, CellarStatus,
  Clarity, Development, Finish, FlavourIntensity, Mousse,
  NoseIntensity, Quality, Readiness, Sweetness, TanninLevel,
  TanninTexture, WineType, AromaCategory,
} from './ordinalScales'

export interface Wine {
  id: string
  created_at: string
  updated_at: string
  wine_name: string
  producer: string | null
  region: string | null
  appellation: string | null
  varietal: string[] | null
  vintage: number | null
  wine_type: WineType
  date_tasted: string
  occasion_notes: string | null
  bottle_photo_url: string | null
  vivino_url: string | null
  price_paid: number | null
  retail_price: number | null
  overall_rating: number
  value_score: number | null
  deal_delta: number | null
  cellar_status: CellarStatus
  appearance_clarity: Clarity | null
  appearance_intensity: AppearanceIntensity | null
  appearance_color: string | null
  nose_condition: 'clean' | 'faulty' | null
  nose_intensity: NoseIntensity | null
  nose_development: Development | null
  palate_sweetness: Sweetness | null
  palate_acidity: Acidity | null
  palate_tannin_level: TanninLevel | null
  palate_tannin_texture: TanninTexture | null
  palate_alcohol: Alcohol | null
  palate_body: Body | null
  palate_mousse: Mousse | null
  palate_flavour_intensity: FlavourIntensity | null
  palate_finish: Finish | null
  conclusion_quality: Quality | null
  conclusion_readiness: Readiness | null
  client_id: string | null
  sync_status: 'synced' | 'pending' | 'conflict'
}

export interface AromaTag {
  id: string
  name: string
  category_hint: AromaCategory
  parent_id: string | null
  display_order: number
  is_custom: boolean
}

export interface WineAroma {
  id: string
  wine_id: string
  tag_id: string
  context: 'nose' | 'palate'
  category: AromaCategory
  aroma_tags?: AromaTag
}

export interface Varietal {
  id: string
  name: string
  color: WineType | null
}

export type WineInsert = Omit<Wine, 'id' | 'created_at' | 'updated_at' | 'value_score' | 'deal_delta'>
export type WineUpdate = Partial<WineInsert>

// Minimal Supabase Database interface expected by createClient
export interface Database {
  public: {
    Tables: {
      wines: { Row: Wine; Insert: WineInsert; Update: WineUpdate }
      aroma_tags: { Row: AromaTag; Insert: Omit<AromaTag, 'id'>; Update: Partial<AromaTag> }
      wine_aromas: { Row: WineAroma; Insert: Omit<WineAroma, 'id'>; Update: Partial<WineAroma> }
      varietals: { Row: Varietal; Insert: Omit<Varietal, 'id'>; Update: Partial<Varietal> }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
