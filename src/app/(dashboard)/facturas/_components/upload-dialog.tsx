'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
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
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function handleFilesSelect(selected: FileList | null) {
    if (!selected) return
    const invalid: string[] = []
    const valid: File[] = []

    Array.from(selected).forEach((f) => {
      if (f.type !== 'application/pdf') {
        invalid.push(`"${f.name}": solo PDF`)
      } else if (f.size > 15 * 1024 * 1024) {
        invalid.push(`"${f.name}": supera 15 MB`)
      } else {
        valid.push(f)
      }
    })

    if (valid.length > 0) {
      setFiles((prev) => {
        const names = new Set(prev.map((f) => f.name))
        return [...prev, ...valid.filter((f) => !names.has(f.name))]
      })
    }
    if (invalid.length > 0) {
      setError(invalid.join(' · '))
    } else {
      setError(null)
    }
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    handleFilesSelect(e.dataTransfer.files)
  }

  async function handleUpload() {
    if (files.length === 0) return
    setLoading(true)
    setError(null)
    const total = files.length

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setProgress({ current: i + 1, total })
      toast.loading(`Procesando factura ${i + 1}/${total}: ${file.name}`, {
        id: 'upload-progress',
      })

      try {
        const formData = new FormData()
        formData.append('pdf', file)

        const res = await fetch('/api/facturas/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (res.status === 409) {
          toast.warning(`${file.name}: ya existe (duplicada)`, { duration: 4000 })
        } else if (!res.ok) {
          toast.error(`${file.name}: ${data.error ?? 'Error desconocido'}`, { duration: 5000 })
        } else {
          toast.success(`${file.name} procesada correctamente`, { duration: 3000 })
        }
      } catch {
        toast.error(`${file.name}: error de conexión`, { duration: 5000 })
      }
    }

    toast.dismiss('upload-progress')
    setLoading(false)
    setProgress(null)
    setOpen(false)
    router.refresh()
  }

  function handleClose() {
    if (loading) return
    setOpen(false)
    setFiles([])
    setError(null)
    setProgress(null)
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
            <DialogTitle>Subir Facturas PDF</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Zona de drop */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Arrastra PDFs aquí</p>
              <p className="text-xs text-muted-foreground mt-1">
                o haz clic para seleccionar · Máx. 15 MB por archivo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => handleFilesSelect(e.target.files)}
              />
            </div>

            {/* Lista de archivos seleccionados */}
            {files.length > 0 && !loading && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
                  >
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                    </div>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Estado de carga */}
            {loading && progress && (
              <div className="flex flex-col items-center gap-2 py-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  Procesando factura {progress.current}/{progress.total}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Gemini está analizando el PDF. Puede tomar 20-60 segundos por archivo.
                </p>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded p-2.5">
                {error}
              </div>
            )}

            {/* Acciones */}
            {!loading && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {files.length > 0
                    ? `${files.length} archivo${files.length !== 1 ? 's' : ''} seleccionado${files.length !== 1 ? 's' : ''}`
                    : ''}
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>Cancelar</Button>
                  <Button
                    onClick={handleUpload}
                    disabled={files.length === 0}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {files.length > 1 ? `Subir ${files.length} facturas` : 'Subir y procesar'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
