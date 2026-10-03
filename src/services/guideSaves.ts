import type { SaveStatus } from '../types'
export type GuideEdit = { kind: 'guideNote'; value: string } | { kind: 'place'; linkId: string; clientId: string; note?: string; categoryId?: string; sortOrder?: number; isStarred?: boolean; remove?: boolean }
type Snapshot = { status: SaveStatus; edits: GuideEdit[]; durable: boolean }
const valid = (e: GuideEdit) => e && (e.kind === 'guideNote' ? typeof e.value === 'string' : e.kind === 'place' && /^[0-9a-f-]{36}$/i.test(e.linkId) && typeof e.clientId === 'string' && (e.note === undefined || typeof e.note === 'string') && (e.categoryId === undefined || typeof e.categoryId === 'string') && (e.sortOrder === undefined || Number.isInteger(e.sortOrder) && e.sortOrder >= 0) && (e.isStarred === undefined || typeof e.isStarred === 'boolean') && (e.remove === undefined || typeof e.remove === 'boolean'))
export class GuideSaveQueue {
  private pending = new Map<string, { edit: GuideEdit; revision: number }>()
  private active = 0
  isActive = () => this.active > 0
  activate = () => { this.active++; return () => { this.active-- } }
  private revision = 0
  private listeners = new Set<() => void>()
  private timer: ReturnType<typeof setTimeout> | undefined
  private running: Promise<void> | null = null
  private snapshot: Snapshot = { status: 'idle', edits: [], durable: true }
  constructor(private key: string, private persist: (edits: GuideEdit[]) => Promise<void>, private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null) {
    try {
      const parsed = JSON.parse(storage?.getItem(key) ?? '[]') as GuideEdit[]
      if (Array.isArray(parsed) && parsed.length <= 1000 && parsed.every(valid)) {
        for (const edit of parsed) this.pending.set(this.id(edit), { edit, revision: ++this.revision })
      }
    } catch { /* Damaged journals must not block reading. */ }
    this.publish(this.pending.size ? 'error' : 'idle', Boolean(storage))
  }
  private id(edit: GuideEdit) { return edit.kind === 'guideNote' ? 'guideNote' : edit.linkId }
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  getSnapshot = () => this.snapshot
  private publish(status: SaveStatus, durable = this.snapshot.durable) {
    this.snapshot = { status, durable, edits: [...this.pending.values()].map(v => v.edit) }
    this.listeners.forEach(listener => listener())
  }
  private checkpoint() {
    try {
      if (!this.storage) return false
      if (this.pending.size) this.storage.setItem(this.key, JSON.stringify([...this.pending.values()].map(v => v.edit)))
      else { this.storage.setItem(this.key, '[]'); this.storage.removeItem(this.key) }
      return true
    } catch { return false }
  }
  stage(edit: GuideEdit) {
    const id = this.id(edit), previous = this.pending.get(id)?.edit
    const merged = edit.kind === 'place' && previous?.kind === 'place' && !edit.remove ? { ...previous, ...edit } : edit
    this.pending.set(id, { edit: merged, revision: ++this.revision })
    this.publish('saving', this.checkpoint())
    clearTimeout(this.timer)
    this.timer = setTimeout(() => { void this.flush().catch(() => {}) }, 450)
  }
  flush = (): Promise<void> => {
    clearTimeout(this.timer)
    if (this.running) return this.running
    if (!this.pending.size) return Promise.resolve()
    this.publish('saving')
    this.running = Promise.resolve().then(async () => {
      try {
        while (this.pending.size) {
          const batch = new Map(this.pending)
          await this.persist([...batch.values()].map(v => v.edit))
          for (const [id, item] of batch) if (this.pending.get(id)?.revision === item.revision) this.pending.delete(id)
          this.publish(this.pending.size ? 'saving' : 'saved', this.checkpoint())
        }
      } catch (error) { this.publish('error', this.checkpoint()); throw error }
      finally { this.running = null }
    })
    return this.running
  }
}
const queues = new Map<string, { userId: string; queue: GuideSaveQueue }>()
export function getGuideSaveQueue(userId: string, guideId: string, persist: (edits: GuideEdit[]) => Promise<void>) {
  const key = `anyones-guide:pending:${userId}:${guideId}`
  let entry = queues.get(key)
  if (!entry) {
    let storage: Storage | null = null
    try { storage = globalThis.localStorage ?? null } catch { /* Memory recovery remains available. */ }
    entry = { userId, queue: new GuideSaveQueue(key, persist, storage) }; queues.set(key, entry)
  }
  return entry.queue
}
export async function flushActiveGuideSaves(userId?: string) {
  if (!userId) return
  for (const entry of queues.values()) if (entry.userId === userId && entry.queue.isActive()) await entry.queue.flush()
}
