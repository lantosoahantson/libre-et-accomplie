import { useEffect, useMemo, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import type { SocialLink, SocialNetwork } from '../lib/social'
import type { PresenceMode } from '../lib/content'

/**
 * Le Cercle des Talents.
 *
 * L'annuaire lit les profils et leurs réseaux dans la base, où les règles d'accès
 * décident déjà de ce que chaque cercle a le droit de voir. Aucune adresse
 * électronique n'est lue : elle n'existe pas dans ces tables.
 */
export interface DirectoryMember {
  id: string
  role: string
  firstName: string
  lastName: string
  headline: string
  activity: string
  approach: string
  skills: string[]
  contributionTopics: string[]
  audience: string
  location: string
  presence: PresenceMode
  currentProject: string
  website: string | null
  instagram: string | null
  socialLinks: SocialLink[]
  hidden: boolean
}

interface ProfileRow {
  id: string
  role: string
  first_name: string
  last_name: string
  headline: string
  activity: string
  approach: string
  skills: string[] | null
  contribution_topics: string[] | null
  audience: string
  location: string
  presence: PresenceMode
  current_project: string
  website: string
  instagram: string
  is_hidden: boolean
}

interface SocialRow {
  id: string
  profile_id: string
  network: SocialNetwork
  label: string
  url: string
  position: number
}

const SELECT_COLUMNS =
  'id, role, first_name, last_name, headline, activity, approach, skills, contribution_topics, audience, location, presence, current_project, website, instagram, is_hidden'

export function useDirectory() {
  const [remote, setRemote] = useState<DirectoryMember[] | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }
    let cancelled = false
    const supabase = getSupabase()

    Promise.all([
      supabase.from('profiles').select(SELECT_COLUMNS).in('status', ['active', 'paused']),
      supabase.from('social_links').select('id, profile_id, network, label, url, position'),
    ])
      .then(([profiles, links]) => {
        if (cancelled) return
        if (profiles.error) throw profiles.error
        const linksByProfile = new Map<string, SocialLink[]>()
        for (const row of (links.data ?? []) as SocialRow[]) {
          const list = linksByProfile.get(row.profile_id) ?? []
          list.push({ id: row.id, network: row.network, label: row.label, url: row.url })
          linksByProfile.set(row.profile_id, list)
        }
        setRemote(
          ((profiles.data ?? []) as ProfileRow[]).map((p) => ({
            id: p.id,
            role: p.role,
            firstName: p.first_name,
            lastName: p.last_name,
            headline: p.headline ?? '',
            activity: p.activity ?? '',
            approach: p.approach ?? '',
            skills: p.skills ?? [],
            contributionTopics: p.contribution_topics ?? [],
            audience: p.audience ?? '',
            location: p.location ?? '',
            presence: p.presence ?? 'les-deux',
            currentProject: p.current_project ?? '',
            website: p.website || null,
            instagram: p.instagram || null,
            socialLinks: linksByProfile.get(p.id) ?? [],
            hidden: p.is_hidden,
          })),
        )
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setError("L'annuaire n'a pas pu être chargé. Réessayez dans un instant.")
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const members = useMemo<DirectoryMember[]>(() => remote ?? [], [remote])

  /** Une fiche masquée par son autrice n'apparaît jamais dans l'annuaire. */
  const visible = useMemo(() => members.filter((m) => !m.hidden), [members])

  return { members, visible, loading, error }
}

/** Recherche simple sur le prénom, l'activité, les compétences et la localisation. */
export function searchMembers(members: DirectoryMember[], query: string): DirectoryMember[] {
  const q = query.trim().toLowerCase()
  if (!q) return members
  const terms = q.split(/\s+/)
  return members.filter((m) => {
    const haystack = [
      m.firstName,
      m.lastName,
      m.activity,
      m.headline,
      m.location,
      m.currentProject,
      ...m.skills,
      ...m.contributionTopics,
    ]
      .join(' ')
      .toLowerCase()
    return terms.every((t) => haystack.includes(t))
  })
}

/**
 * Noms des membres, pour signer publications, projets, ressources et événements.
 * Ne lit que les colonnes nécessaires à l'affichage d'un nom.
 */
export function useMembers() {
  const [members, setMembers] = useState<{ id: string; firstName: string; lastName: string }[]>([])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    getSupabase()
      .from('profiles')
      .select('id, first_name, last_name')
      .then(({ data }) => {
        if (cancelled || !data) return
        setMembers(
          (data as { id: string; first_name: string; last_name: string }[]).map((p) => ({
            id: p.id,
            firstName: p.first_name ?? '',
            lastName: p.last_name ?? '',
          })),
        )
      })
    return () => {
      cancelled = true
    }
  }, [])

  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  return {
    members,
    byId,
    /** Nom affichable, avec un repli discret si la fiche n'est pas visible. */
    nameOf: (id: string) => {
      const m = byId.get(id)
      const full = `${m?.firstName ?? ''} ${m?.lastName ?? ''}`.trim()
      return full || 'Un membre du Cocon'
    },
  }
}
