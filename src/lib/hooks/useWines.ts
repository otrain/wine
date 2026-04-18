import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../supabase'
import { enqueueWine } from '../syncQueue'
import type { Wine, WineInsert, WineUpdate, WineAroma, AromaTag, Varietal } from '../database.types'

export interface WineFilters {
  search?: string
  wine_type?: string[]
  cellar_status?: string[]
  min_price?: number
  max_price?: number
  min_rating?: number
  max_rating?: number
  min_vintage?: number
  max_vintage?: number
  palate_acidity?: string[]
  palate_sweetness?: string[]
  palate_body?: string[]
  palate_tannin_level?: string[]
}

export function useWines(filters: WineFilters = {}) {
  return useQuery({
    queryKey: ['wines', filters],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let q = supabase.from('wines').select('*') as any
      if (filters.search) q = q.textSearch('wine_name', filters.search, { type: 'plain' })
      if (filters.wine_type?.length) q = q.in('wine_type', filters.wine_type)
      if (filters.cellar_status?.length) q = q.in('cellar_status', filters.cellar_status)
      if (filters.min_price != null) q = q.gte('price_paid', filters.min_price)
      if (filters.max_price != null) q = q.lte('price_paid', filters.max_price)
      if (filters.min_rating != null) q = q.gte('overall_rating', filters.min_rating)
      if (filters.max_rating != null) q = q.lte('overall_rating', filters.max_rating)
      if (filters.min_vintage != null) q = q.gte('vintage', filters.min_vintage)
      if (filters.max_vintage != null) q = q.lte('vintage', filters.max_vintage)
      if (filters.palate_acidity?.length) q = q.in('palate_acidity', filters.palate_acidity)
      if (filters.palate_sweetness?.length) q = q.in('palate_sweetness', filters.palate_sweetness)
      if (filters.palate_body?.length) q = q.in('palate_body', filters.palate_body)
      if (filters.palate_tannin_level?.length) q = q.in('palate_tannin_level', filters.palate_tannin_level)
      q = q.order('date_tasted', { ascending: false })
      const { data, error } = await q
      if (error) throw error
      return (data ?? []) as Wine[]
    },
  })
}

export function useWine(id: string | undefined) {
  return useQuery({
    queryKey: ['wine', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from('wines').select('*').eq('id', id!).single()
      if (error) throw error
      return data as unknown as Wine
    },
  })
}

export function useWineAromas(wineId: string | undefined) {
  return useQuery({
    queryKey: ['wine_aromas', wineId],
    enabled: !!wineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wine_aromas')
        .select('*, aroma_tags(*)')
        .eq('wine_id', wineId!)
      if (error) throw error
      return (data ?? []) as unknown as WineAroma[]
    },
  })
}

export function useCreateWine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      wine,
      aromas,
    }: {
      wine: WineInsert
      aromas: { tag_id: string; context: 'nose' | 'palate'; category: string }[]
    }) => {
      const isOnline = navigator.onLine
      const client_id = crypto.randomUUID()

      if (!isOnline) {
        await enqueueWine({ ...wine, client_id, aromas })
        return null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('wines') as any)
        .insert({ ...wine, client_id })
        .select()
        .single()
      if (error) throw error

      const created = data as Wine
      if (aromas.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: aromaErr } = await (supabase.from('wine_aromas') as any).insert(
          aromas.map((a) => ({ wine_id: created.id, ...a }))
        )
        if (aromaErr) throw aromaErr
      }

      return created
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wines'] }),
  })
}

export function useUpdateWine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      wine,
      aromas,
    }: {
      id: string
      wine: WineUpdate
      aromas?: { tag_id: string; context: 'nose' | 'palate'; category: string }[]
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from('wines') as any)
        .update(wine)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error

      if (aromas) {
        await supabase.from('wine_aromas').delete().eq('wine_id', id)
        if (aromas.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from('wine_aromas') as any).insert(
            aromas.map((a) => ({ wine_id: id, ...a }))
          )
        }
      }

      return data as Wine
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['wines'] })
      qc.invalidateQueries({ queryKey: ['wine', id] })
      qc.invalidateQueries({ queryKey: ['wine_aromas', id] })
    },
  })
}

export function useDeleteWine() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('wines').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wines'] }),
  })
}

export function useAromaTags() {
  return useQuery({
    queryKey: ['aroma_tags'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('aroma_tags').select('*').order('display_order')
      if (error) throw error
      return (data ?? []) as unknown as AromaTag[]
    },
  })
}

export function useVarietals() {
  return useQuery({
    queryKey: ['varietals'],
    staleTime: Infinity,
    queryFn: async () => {
      const { data, error } = await supabase.from('varietals').select('*').order('name')
      if (error) throw error
      return (data ?? []) as unknown as Varietal[]
    },
  })
}
