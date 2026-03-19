"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-client-simple"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import { toast } from "sonner"
import { HistoryGrid } from "@/components/app/history/HistoryGrid"
import { HistoryDetailModal } from "@/components/app/history/HistoryDetailModal"

export type HistoryListItem = {
  id: string
  outputUrls: Array<{ type: 'image' | 'video'; url: string; thumbnail_url?: string }>
  status: string
  createdAt: string
}

type HistoryDetail = {
  id: string
  taskId: string
  outputUrls: Array<{ type: 'image' | 'video'; url: string; thumbnail_url?: string }>
  modelName: string
  pageName: string
  status: string
  generationTimeMs: number | null
  settings: {
    style?: string | null
    mode?: string | null
    transformationStrength?: number | null
    skinTextureSize?: number | null
    detailLevel?: number | null
    prompt?: string | null
    aspect_ratio?: string | null
    count?: number | null
    failure_reason?: string
  }
  createdAt: string
}

/** Returns column count matching the CSS grid breakpoints */
function getGridCols(): number {
  if (typeof window === 'undefined') return 4
  const w = window.innerWidth
  if (w >= 1280) return 5
  if (w >= 1024) return 4
  if (w >= 640) return 3
  return 2
}

/**
 * Finds the first grid card that's at or below the top of the viewport and
 * returns its id plus its absolute Y position (relative to document top).
 * Used to anchor scroll position before/after a prepend.
 */
function findScrollAnchor(): { id: string; docTop: number } | null {
  const cards = document.querySelectorAll<HTMLElement>('[data-history-id]')
  for (const card of Array.from(cards)) {
    const rect = card.getBoundingClientRect()
    if (rect.bottom > 0) {
      return { id: card.getAttribute('data-history-id')!, docTop: rect.top + window.scrollY }
    }
  }
  return null
}

export default function HistoryPage() {
  const { user, isLoading, isDemo } = useAuth()
  const [items, setItems] = useState<HistoryListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [selected, setSelected] = useState<HistoryDetail | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const loadingRef = useRef(false)

  // Keeps a live copy of items so the polling closure never reads stale state
  const itemsRef = useRef<HistoryListItem[]>([])
  useEffect(() => { itemsRef.current = items }, [items])

  // When we're about to prepend items, we save the scroll anchor here.
  // useLayoutEffect below reads it after the DOM has been updated.
  const scrollAnchorRef = useRef<{ id: string; docTop: number } | null>(null)

  // Runs synchronously after every items change, before the browser paints.
  // If we stored an anchor before the update, scroll back to it now.
  useLayoutEffect(() => {
    if (!scrollAnchorRef.current) return
    const { id, docTop: savedDocTop } = scrollAnchorRef.current
    scrollAnchorRef.current = null

    const el = document.querySelector<HTMLElement>(`[data-history-id="${id}"]`)
    if (!el) return

    const newDocTop = el.getBoundingClientRect().top + window.scrollY
    const diff = newDocTop - savedDocTop
    if (Math.abs(diff) > 1) {
      window.scrollTo({ top: window.scrollY + diff, behavior: 'instant' })
    }
  }, [items])

  const loadHistory = async (reset = false) => {
    if (loadingRef.current) return
    loadingRef.current = true
    if (!reset) setLoadingMore(true)
    try {
      const params = new URLSearchParams()
      // Initial load: exactly 6 rows (cols × 6) so the grid always ends on a full row.
      // Load More: same page size for consistency.
      const cols = getGridCols()
      params.set('limit', String(cols * 6))
      if (!reset && cursor) {
        params.set('cursor', cursor)
      }

      const res = await fetch(`/api/history/list?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        console.error('History load failed:', errorData)
        toast.error(errorData.error || 'Failed to load history')
        setLoading(false)
        return
      }

      const data = await res.json()
      const newItems: HistoryListItem[] = data.items || []

      setItems(prev => reset ? newItems : [...prev, ...newItems])
      setCursor(data.nextCursor || null)
      setHasMore(!!data.hasMore)
    } catch (error) {
      console.error('History load error:', error)
      toast.error('Connection error while loading history')
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingRef.current = false
    }
  }

  useEffect(() => {
    if (!user) return
    loadHistory(true)
  }, [user])

  // Polling: fetches top 20 items every 4s to catch new generations and status changes.
  useEffect(() => {
    if (!user) return

    const refresh = async () => {
      try {
        const res = await fetch('/api/history/list?limit=20', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const fresh: HistoryListItem[] = data.items || []
        if (fresh.length === 0) return

        // Pre-check using itemsRef (never stale) whether we'll be prepending new items.
        // If yes, capture the scroll anchor BEFORE calling setItems so useLayoutEffect
        // can restore the position after the DOM updates.
        const existingIds = new Set(itemsRef.current.map(i => i.id))
        const hasBrandNew = fresh.some(f => !existingIds.has(f.id))
        if (hasBrandNew) {
          scrollAnchorRef.current = findScrollAnchor()
        }

        setItems(prev => {
          const freshMap = new Map(fresh.map(f => [f.id, f]))
          let changed = false
          const updated = prev.map(item => {
            const f = freshMap.get(item.id)
            if (!f) return item
            const statusChanged = f.status !== item.status
            const urlsAdded = f.outputUrls?.length > 0 && item.outputUrls?.length === 0
            if (statusChanged || urlsAdded) { changed = true; return { ...item, ...f } }
            return item
          })
          const ids = new Set(prev.map(i => i.id))
          const brandNew = fresh.filter(f => !ids.has(f.id))
          if (brandNew.length === 0 && !changed) return prev
          return brandNew.length > 0 ? [...brandNew, ...updated] : updated
        })

        // Also re-fetch any processing items that weren't covered by the top-20
        setItems(prev => {
          const processingNotFetched = prev.filter(i => i.status === 'processing' && !fresh.find(f => f.id === i.id))
          if (processingNotFetched.length === 0) return prev
          const ids = processingNotFetched.map(i => i.id).join(',')
          fetch(`/api/history/list?ids=${ids}`, { cache: 'no-store' })
            .then(r => r.json())
            .then(d => {
              const extra: HistoryListItem[] = d.items || []
              if (extra.length === 0) return
              setItems(p => p.map(item => {
                const f = extra.find(e => e.id === item.id)
                if (f && (f.status !== item.status || (f.outputUrls?.length > 0 && item.outputUrls?.length === 0))) {
                  return { ...item, ...f }
                }
                return item
              }))
            })
            .catch(() => {})
          return prev
        })
      } catch {}
    }

    void refresh()
    const interval = setInterval(refresh, 4000)
    return () => clearInterval(interval)
  }, [user])

  const openDetail = async (id: string) => {
    const basicItem = items.find(i => i.id === id)
    if (basicItem) {
      setSelected({
        id: basicItem.id,
        taskId: '',
        outputUrls: basicItem.outputUrls,
        modelName: '',
        pageName: '',
        status: basicItem.status,
        generationTimeMs: null,
        settings: {},
        createdAt: basicItem.createdAt,
      })
      setModalOpen(true)
      setDetailsLoading(true)
    } else {
      setLoadingItemId(id)
    }

    try {
      const res = await fetch(`/api/history/item?id=${id}`, { cache: 'no-store' })
      if (!res.ok) {
        if (!basicItem) toast.error('Failed to load details')
        return
      }
      const data = await res.json()
      setSelected(data)
      if (!basicItem) setModalOpen(true)
    } catch (error) {
      console.error('Failed to open detail:', error)
      if (!basicItem) toast.error('Connection error')
    } finally {
      setDetailsLoading(false)
      setLoadingItemId(null)
    }
  }

  if (isLoading) {
    return <ElegantLoading message="Loading history..." />
  }

  if (!user && !isDemo) {
    if (typeof window !== 'undefined') {
      window.location.href = '/app/signin'
    }
    return <ElegantLoading message="Redirecting to login..." />
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#FFFF00] selection:text-black">
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-end justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">History</h1>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
                <p className="text-[11px] text-white/40 tracking-wide">Media outputs expire <span className="text-white/60 font-medium">30 days</span> after creation</p>
              </div>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                loadHistory(true)
              }}
              className="px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all cursor-pointer flex items-center gap-2"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <ElegantLoading message="Loading history..." />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <span className="text-2xl">📜</span>
              </div>
              <p className="text-white/60 text-sm">No history items yet</p>
              <button onClick={() => window.location.href = '/app/skineditor'} className="text-[#FFFF00] text-sm hover:underline">Start Creating</button>
            </div>
          ) : (
            <HistoryGrid items={items} onSelect={openDetail} loadingItemId={loadingItemId} />
          )}

          {hasMore && !loading && (
            <div className="flex justify-center pt-8">
              <button
                onClick={() => loadHistory()}
                disabled={loadingMore}
                className="px-8 py-3 text-xs font-bold uppercase tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </main>

      <HistoryDetailModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setDetailsLoading(false) }}
        item={selected}
        detailsLoading={detailsLoading}
      />
    </div>
  )
}
