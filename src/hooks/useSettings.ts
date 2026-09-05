import { useEffect, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { AppSetting } from '../lib/database.types'

/**
 * Charge les paramètres généraux visibles par l'utilisateur courant.
 * La base ne renvoie que ce que la RLS autorise (public / membres / fondatrices).
 */
export function useSettings() {
  const [settings, setSettings] = useState<Record<string, AppSetting>>({})
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    getSupabase()
      .from('app_settings')
      .select('*')
      .then(({ data }) => {
        if (cancelled) return
        const map: Record<string, AppSetting> = {}
        for (const s of (data ?? []) as AppSetting[]) map[s.key] = s
        setSettings(map)
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const text = (key: string, fallback = ''): string => {
    const v = settings[key]?.value
    return typeof v === 'string' && v.trim() ? v : fallback
  }

  return { settings, loading, text }
}
