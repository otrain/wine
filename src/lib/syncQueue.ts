import Dexie, { type Table } from 'dexie'
import type { WineInsert } from './database.types'
import { supabase } from './supabase'

interface SyncQueueItem {
  id?: number
  client_id: string
  payload: WineInsert & { aromas?: { tag_id: string; context: 'nose' | 'palate'; category: string }[] }
  status: 'pending' | 'syncing' | 'failed'
  created_at: number
  attempts: number
}

interface DraftWine {
  id?: number
  draft_key: string
  data: Partial<WineInsert & { aromas?: unknown }>
  updated_at: number
}

class WineDB extends Dexie {
  sync_queue!: Table<SyncQueueItem>
  drafts!: Table<DraftWine>

  constructor() {
    super('wine-tracker')
    this.version(1).stores({
      sync_queue: '++id, client_id, status, created_at',
      drafts: '++id, &draft_key, updated_at',
    })
  }
}

export const db = new WineDB()

export async function enqueueWine(item: SyncQueueItem['payload']): Promise<string> {
  const client_id = crypto.randomUUID()
  await db.sync_queue.add({ client_id, payload: item, status: 'pending', created_at: Date.now(), attempts: 0 })
  return client_id
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveDraft(key: string, data: any): Promise<void> {
  const existing = await db.drafts.where('draft_key').equals(key).first()
  if (existing?.id) {
    await db.drafts.update(existing.id, { data, updated_at: Date.now() })
  } else {
    await db.drafts.add({ draft_key: key, data, updated_at: Date.now() })
  }
}

export async function loadDraft(key: string): Promise<DraftWine['data'] | null> {
  const row = await db.drafts.where('draft_key').equals(key).first()
  return row?.data ?? null
}

export async function clearDraft(key: string): Promise<void> {
  await db.drafts.where('draft_key').equals(key).delete()
}

export async function getPendingQueue(): Promise<SyncQueueItem[]> {
  return db.sync_queue.where('status').equals('pending').toArray()
}

export async function markSynced(id: number): Promise<void> {
  await db.sync_queue.delete(id)
}

export async function markFailed(id: number, attempts: number): Promise<void> {
  await db.sync_queue.update(id, { status: 'failed', attempts })
}

export async function flushQueue(): Promise<void> {
  if (!navigator.onLine) return

  const pending = await getPendingQueue()
  if (pending.length === 0) return

  for (const item of pending) {
    try {
      await db.sync_queue.update(item.id!, { status: 'syncing' })

      const { aromas, ...wineData } = item.payload

      // Insert wine row
      const { data: inserted, error } = await supabase
        .from('wines')
        .insert(wineData)
        .select('id')
        .single()

      if (error) throw error

      // Insert aromas if present
      if (aromas?.length && inserted?.id) {
        const aromaRows = aromas.map(a => ({ ...a, wine_id: inserted.id }))
        const { error: aromaErr } = await supabase.from('wine_aromas').insert(aromaRows)
        if (aromaErr) throw aromaErr
      }

      await markSynced(item.id!)
    } catch (err) {
      const attempts = (item.attempts ?? 0) + 1
      if (attempts >= 3) {
        // After 3 failures, mark failed and stop retrying automatically
        await markFailed(item.id!, attempts)
      } else {
        await db.sync_queue.update(item.id!, { status: 'pending', attempts })
      }
      console.error('Sync failed for item', item.client_id, err)
    }
  }
}
