'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-3 py-2 text-sm bg-[#6ab04c] text-white rounded-md shadow hover:bg-[#4a8a35]"
    >
      <Printer className="h-4 w-4" />
      Imprimir / Guardar PDF
    </button>
  )
}
