import { Skeleton } from '@/components/ui/skeleton'

export default function ConfiguracionLoading() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <Skeleton className="h-8 w-40" />

      {/* Pestañas */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-32 rounded-md" />
        ))}
      </div>

      {/* Contenido */}
      <div className="border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-36" />
        </div>
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 flex gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-6 px-4 py-3 border-t items-center">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-6 w-10 rounded-full" />
              <Skeleton className="h-4 w-16 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
