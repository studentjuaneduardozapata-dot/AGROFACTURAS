import { createBrowserClient } from '@supabase/ssr'

// Los tipos se generarán con: npx supabase gen types typescript --project-id <ID> > src/lib/supabase/types.ts
// Por ahora el cliente opera sin tipos estrictos de DB (las queries funcionan correctamente)
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
