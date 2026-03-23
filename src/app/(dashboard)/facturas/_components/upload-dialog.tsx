'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadDialog() {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFileSelect(selected: File | null) {
    if (!selected) return
    if (selected.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF')
      return
    }
    if (selected.size > 15 * 1024 * 1024) {
      setError('El archivo no puede superar 15 MB')
      return
    }
    setFile(selected)
    setError(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    handleFileSelect(dropped)
  }

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    setError(null)
    setStatus('Subiendo archivo...')

    try {
      const formData = new FormData()
      formData.append('pdf', file)

      setStatus('Extrayendo datos con IA...')
      const res = await fetch('/api/facturas/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 409 && data.facturaId) {
          // Duplicado — redirigir a la factura existente
          setOpen(false)
          router.push(`/facturas/${data.facturaId}/validar`)
          return
        }
        throw new Error(data.error ?? 'Error al procesar la factura')
      }

      setStatus('¡Completado!')
      setOpen(false)
      router.push(`/facturas/${data.facturaId}/validar`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
      setStatus('')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
    setFile(null)
    setError(null)
    setStatus('')
  }

  return (
    <>
      <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Nueva Factura
        </Button>
      </span>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Factura PDF</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Zona de drop */}
            {!file && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Arrastra el PDF aquí</p>
                <p className="text-xs text-muted-foreground mt-1">o haz clic para seleccionar</p>
                <p className="text-xs text-muted-foreground mt-1">Máximo 15 MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
                />
              </div>
            )}

            {/* Archivo seleccionado */}
            {file && !loading && (
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                <FileText className="h-8 w-8 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={() => { setFile(null); setError(null) }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Estado de carga */}
            {loading && (
              <div className="flex flex-col items-center gap-3 py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">{status}</p>
                <p className="text-xs text-muted-foreground text-center">
                  Gemini está analizando la factura. Esto puede tomar 20-60 segundos.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded p-3">
                {error}
              </div>
            )}

            {/* Acciones */}
            {!loading && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                <Button
                  onClick={handleUpload}
                  disabled={!file}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Subir y procesar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
