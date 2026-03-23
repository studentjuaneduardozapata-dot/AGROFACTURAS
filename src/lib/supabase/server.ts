import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Los tipos se generarán con: npx supabase gen types typescript --project-id <ID> > src/lib/supabase/types.ts
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll called from Server Component — cookies serán manejados por middleware
          }
        },
      },
    }
  )
}
