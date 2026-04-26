'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, Trash2, FileText, Loader2, CheckCircle, AlertTriangle, Brain } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface KnowledgeDoc {
  id: string
  name: string
  file_size: number
  status: 'processing' | 'ready' | 'error'
  error_message: string | null
  created_at: string
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function KnowledgeBasePage() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/knowledge-base')
    const data = await res.json()
    setDocs(data.documents ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const uploadFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Nur PDF-Dateien erlaubt')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Datei zu groß (max. 20 MB)')
      return
    }
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/knowledge-base', { method: 'POST', body: form })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) {
      toast.error(data.error ?? 'Upload fehlgeschlagen')
      return
    }
    toast.success(`"${file.name}" hochgeladen und verarbeitet`)
    load()
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(uploadFile)
  }

  const handleDelete = async (id: string, name: string) => {
    setDeletingId(id)
    const res = await fetch(`/api/knowledge-base/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      setDocs(prev => prev.filter(d => d.id !== id))
      toast.success(`"${name}" gelöscht`)
    } else {
      toast.error('Löschen fehlgeschlagen')
    }
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="eyebrow mb-1">KI-Kontext</div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Manrope, sans-serif', color: 'var(--fg-1)' }}>
          Knowledge Base
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-3)' }}>
          Lade deine Trading-Unterlagen hoch — die KI nutzt sie für alle Analysen und Coachings.
        </p>
      </div>

      {/* How it works */}
      <div
        className="rounded-lg px-5 py-4 flex items-start gap-3"
        style={{ background: 'rgba(41,98,255,0.08)', border: '1px solid rgba(41,98,255,0.2)' }}
      >
        <Brain className="h-4 w-4 shrink-0 mt-0.5" style={{ color: 'var(--brand-blue)' }} />
        <p className="text-sm" style={{ color: 'var(--fg-2)' }}>
          Die KI liest deine hochgeladenen PDFs (Strategie-Dokumente, Regelsets, Kurs-Unterlagen) und bezieht sich bei Trade-Analysen und der Wochenvorbereitung explizit darauf — kein generisches Feedback mehr.
        </p>
      </div>

      {/* Upload Zone */}
      <div
        className="rounded-lg border-2 border-dashed transition-colors"
        style={{ borderColor: dragOver ? 'var(--brand-blue)' : 'var(--border-raw)' }}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
      >
        <div className="flex flex-col items-center gap-3 py-10 px-6 text-center">
          {uploading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--brand-blue)' }} />
              <p className="text-sm" style={{ color: 'var(--fg-3)' }}>PDF wird verarbeitet…</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 opacity-30" style={{ color: 'var(--fg-3)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--fg-2)' }}>
                  PDF hierher ziehen oder
                </p>
                <button
                  onClick={() => inputRef.current?.click()}
                  className="text-sm underline"
                  style={{ color: 'var(--brand-blue)' }}
                >
                  Datei auswählen
                </button>
              </div>
              <p className="text-xs" style={{ color: 'var(--fg-4)' }}>
                Nur PDF · max. 20 MB · max. 10 Dokumente
              </p>
            </>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {/* Document List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--fg-4)' }}>
            Dokumente ({docs.length}/10)
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4" style={{ color: 'var(--fg-4)' }}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Laden…</span>
          </div>
        ) : docs.length === 0 ? (
          <div
            className="rounded-lg py-8 text-center"
            style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}
          >
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" style={{ color: 'var(--fg-4)' }} />
            <p className="text-sm" style={{ color: 'var(--fg-4)' }}>Noch keine Dokumente hochgeladen</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--border-raw)' }}
              >
                <FileText className="h-4 w-4 shrink-0" style={{ color: 'var(--fg-4)' }} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--fg-1)' }}>{doc.name}</p>
                  <p className="text-xs" style={{ color: 'var(--fg-4)' }}>
                    {formatBytes(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString('de-DE')}
                  </p>
                  {doc.status === 'error' && doc.error_message && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--short)' }}>{doc.error_message}</p>
                  )}
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {doc.status === 'processing' && (
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--fg-4)' }}>
                      <Loader2 className="h-3 w-3 animate-spin" /> Verarbeitung…
                    </span>
                  )}
                  {doc.status === 'ready' && (
                    <CheckCircle className="h-4 w-4" style={{ color: 'var(--long)' }} />
                  )}
                  {doc.status === 'error' && (
                    <AlertTriangle className="h-4 w-4" style={{ color: 'var(--short)' }} />
                  )}
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(doc.id, doc.name)}
                  disabled={deletingId === doc.id}
                  className="shrink-0 p-1 rounded transition-colors"
                  style={{ color: 'var(--fg-4)' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--short)')}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--fg-4)')}
                >
                  {deletingId === doc.id
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
