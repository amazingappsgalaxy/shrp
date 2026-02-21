"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-client-simple"
import { ElegantLoading } from "@/components/ui/elegant-loading"
import { toast } from "sonner"
import { HistoryGrid } from "@/components/app/history/HistoryGrid"
import { HistoryDetailModal } from "@/components/app/history/HistoryDetailModal"

export type HistoryListItem = {
  id: string
  outputUrls: Array<{ type: 'image' | 'video'; url: string }>
  status: string
  createdAt: string
}

type HistoryDetail = {
  id: string
  taskId: string
  outputUrls: Array<{ type: 'image' | 'video'; url: string }>
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
    failure_reason?: string
  }
  createdAt: string
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
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)

  const loadHistory = async (reset = false) => {
    if (!reset) setLoadingMore(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '24')
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
    }
  }

  const updateProcessingItems = async () => {
    const processingIds = items
      .filter(item => item.status === 'processing')
      .map(item => item.id)

    if (processingIds.length === 0) return

    try {
      const params = new URLSearchParams()
      params.set('ids', processingIds.join(','))

      const res = await fetch(`/api/history/list?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) return

      const data = await res.json()
      const updatedItems: HistoryListItem[] = data.items || []

      if (updatedItems.length > 0) {
        setItems(prev => prev.map(item => {
          const updated = updatedItems.find(u => u.id === item.id)
          return updated ? { ...item, ...updated } : item
        }))
      }
    } catch (error) {
      // Silent fail for background updates
      console.error('Background update failed', error)
    }
  }

  const TWELVE_DAYS_MS = 12 * 24 * 60 * 60 * 1000
  const displayedItems = useMemo(
    () => items.filter(item => Date.now() - new Date(item.createdAt).getTime() < TWELVE_DAYS_MS),
    [items]
  )

  const refreshIfProcessing = useMemo(
    () => items.some(item => item.status === 'processing'),
    [items]
  )

  useEffect(() => {
    if (!user) return
    loadHistory(true)
  }, [user])

  useEffect(() => {
    if (!refreshIfProcessing) return
    const interval = setInterval(() => {
      updateProcessingItems()
    }, 3000)
    return () => clearInterval(interval)
  }, [refreshIfProcessing])

  const openDetail = async (id: string) => {
    setLoadingItemId(id)
    try {
      const res = await fetch(`/api/history/item?id=${id}`, { cache: 'no-store' })
      if (!res.ok) {
        toast.error('Failed to load details')
        return
      }
      const data = await res.json()
      setSelected(data)
      setModalOpen(true)
    } catch (error) {
      console.error('Failed to open detail:', error)
      toast.error('Connection error')
    } finally {
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
              {/* Retention notice */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.07] w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
                <p className="text-[11px] text-white/40 tracking-wide">Media outputs expire <span className="text-white/60 font-medium">10 days</span> after creation</p>
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
          ) : displayedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                <span className="text-2xl">📜</span>
              </div>
              <p className="text-white/60 text-sm">No history items yet</p>
              <button onClick={() => window.location.href = '/app/editor'} className="text-[#FFFF00] text-sm hover:underline">Start Creating</button>
            </div>
          ) : (
            <HistoryGrid items={displayedItems} onSelect={openDetail} loadingItemId={loadingItemId} />
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
        onClose={() => setModalOpen(false)}
        item={selected}
      />
    </div>
  )
}
