'use client'

import { useCallback, useEffect, useState } from 'react'

export interface WatchlistItem {
  id: string
  symbol: string
  name: string | null
  category: string
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/watchlist')
    if (res.ok) {
      const data = await res.json()
      setItems(data.items ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addItem = useCallback(async (symbol: string, name?: string, category?: string) => {
    const res = await fetch('/api/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, name, category }),
    })
    if (res.ok) {
      const data = await res.json()
      setItems(prev => [...prev, data.item])
      return { error: null }
    }
    const data = await res.json()
    return { error: data.error ?? 'Fehler beim Hinzufügen' }
  }, [])

  const removeItem = useCallback(async (id: string) => {
    const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' })
    if (res.ok) setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const symbols = items.map(i => i.symbol)

  return { items, symbols, loading, addItem, removeItem, reload: load }
}
