'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAccountContext } from '@/contexts/AccountContext'
import { useTrades, Trade } from '@/hooks/useTrades'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Send, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface Message {
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

const MAX_MESSAGES = 20

export function CoachPage() {
  const { activeAccount } = useAccountContext()
  const { fetchTrades } = useTrades()
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradesLoading, setTradesLoading] = useState(true)
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = async () => {
      setTradesLoading(true)
      const page = await fetchTrades({}, 1)
      setTrades(page.trades)
      setTradesLoading(false)
    }
    load()
  }, [fetchTrades])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  const loadConversation = useCallback(async (tradeId: string) => {
    if (!activeAccount) return
    setIsLoading(true)
    setMessages([])
    setConversationId(null)
    try {
      const res = await fetch(
        `/api/coach/conversation?trade_id=${tradeId}&account_id=${activeAccount.id}`
      )
      const data = await res.json()
      if (res.ok) {
        setMessages(data.messages || [])
        setConversationId(data.id || null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [activeAccount])

  const handleTradeSelect = async (tradeId: string) => {
    setSelectedTradeId(tradeId)
    await loadConversation(tradeId)
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedTradeId || !activeAccount || isStreaming) return
    if (messages.length >= MAX_MESSAGES) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/coach/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: activeAccount.id,
          trade_id: selectedTradeId,
          conversation_id: conversationId,
          message: userMessage.content,
        }),
      })

      if (!res.ok || !res.body) {
        setIsStreaming(false)
        return
      }

      // Handle streaming response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ''

      // Add placeholder assistant message
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '', created_at: new Date().toISOString() },
      ])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        // Parse SSE chunks
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.type === 'conversation_id') {
                setConversationId(parsed.id)
              } else if (parsed.type === 'delta') {
                assistantContent += parsed.content
                setMessages(prev => {
                  const updated = [...prev]
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantContent,
                  }
                  return updated
                })
              }
            } catch {
              // not JSON, raw text delta
              assistantContent += data
              setMessages(prev => {
                const updated = [...prev]
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: assistantContent,
                }
                return updated
              })
            }
          }
        }
      }
    } finally {
      setIsStreaming(false)
    }
  }

  const selectedTrade = trades.find(t => t.id === selectedTradeId)
  const messageCount = messages.length
  const atLimit = messageCount >= MAX_MESSAGES

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">KI-Coach</h1>
        {selectedTradeId && (
          <span className="text-sm text-muted-foreground ml-auto">
            {messageCount}/{MAX_MESSAGES} Nachrichten
          </span>
        )}
      </div>

      {/* Trade selector */}
      <div className="flex items-center gap-3">
        {tradesLoading ? (
          <Skeleton className="h-9 w-72" />
        ) : (
          <Select onValueChange={handleTradeSelect} value={selectedTradeId ?? ''}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Trade auswählen..." />
            </SelectTrigger>
            <SelectContent>
              {trades.length === 0 ? (
                <SelectItem value="__empty" disabled>
                  Keine Trades vorhanden
                </SelectItem>
              ) : (
                trades.map(trade => (
                  <SelectItem key={trade.id} value={trade.id}>
                    {trade.asset} · {trade.direction === 'long' ? 'Long' : 'Short'} ·{' '}
                    {format(new Date(trade.traded_at), 'dd.MM.yy', { locale: de })}
                    {trade.outcome === 'win' ? ' ✓' : trade.outcome === 'loss' ? ' ✗' : ''}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {!selectedTradeId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
          <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">Wähle einen Trade aus um das Gespräch zu starten.</p>
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Trade context bar */}
          {selectedTrade && (
            <div className="px-4 py-2 border-b bg-muted/30 text-xs text-muted-foreground flex gap-4 flex-wrap">
              <span className="font-medium text-foreground">{selectedTrade.asset}</span>
              <span>{selectedTrade.direction === 'long' ? 'Long' : 'Short'}</span>
              {selectedTrade.setup_type && <span>{selectedTrade.setup_type}</span>}
              <span>{format(new Date(selectedTrade.traded_at), 'dd. MMM yyyy', { locale: de })}</span>
            </div>
          )}

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 && !isStreaming && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  Sende eine erste Nachricht und dein KI-Coach startet das Gespräch.
                </p>
              )}
              {messages.map((msg, i) => (
                <MessageBubble key={i} message={msg} />
              ))}
              {isStreaming && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
                <div className="flex gap-2 items-start">
                  <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs">KI</span>
                  </div>
                  <div className="bg-muted rounded-lg px-3 py-2 max-w-[80%]">
                    <div className="flex gap-1 py-1">
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t space-y-2">
            {atLimit && (
              <p className="text-xs text-muted-foreground text-center">
                Maximale Gesprächslänge erreicht — lass uns das Gespräch zusammenfassen.
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder={atLimit ? 'Gesprächslimit erreicht' : 'Deine Antwort...'}
                rows={2}
                className="resize-none text-sm"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={atLimit || isStreaming}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
              />
              <Button
                size="icon"
                className="h-auto"
                onClick={handleSend}
                disabled={!input.trim() || atLimit || isStreaming}
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'
  return (
    <div className={cn('flex gap-2 items-start', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs',
          isUser ? 'bg-primary/20' : 'bg-purple-500/20'
        )}
      >
        {isUser ? 'Du' : 'KI'}
      </div>
      <div
        className={cn(
          'rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap leading-relaxed',
          isUser ? 'bg-primary/10 text-foreground' : 'bg-muted text-foreground'
        )}
      >
        {message.content}
      </div>
    </div>
  )
}
