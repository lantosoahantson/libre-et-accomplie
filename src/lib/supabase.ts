import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Vrai si les variables d'environnement Supabase sont renseignées (fichier .env.local). */
export const isSupabaseConfigured =
  Boolean(url && anonKey) &&
  !String(url).includes('xxxxxxxx') &&
  !String(anonKey).includes('xxxxxxxx')

/** Adresse publique du site, utilisée pour les liens de connexion. */
export const siteUrl: string =
  (import.meta.env.VITE_SITE_URL as string | undefined) ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')

let client: SupabaseClient | null = null

/**
 * Client Supabase côté navigateur. Utilise uniquement la clé publique (anon) :
 * la clé service_role n'est jamais embarquée dans l'application.
 */
export function getSupabase(): SupabaseClient {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase n'est pas configuré : renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans .env.local.",
    )
  }
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  }
  return client
}
