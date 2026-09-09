import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSupabase, isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from './useAuth'
import type {
  CocoonEvent,
  EventAttendee,
  Post,
  PostComment,
  PostSupport,
  Project,
  Resource,
} from '../lib/content'

/**
 * Accès aux contenus partagés du Cocon.
 *
 * Tout passe par Supabase : ce qu'une personne enregistre, les autres membres
 * connectés le voient. Rien n'est conservé dans le navigateur. Les règles d'accès
 * sont appliquées en base ; l'interface ne fait que refléter ce qu'elles autorisent.
 */

const GENERIC_ERROR = 'Le chargement a échoué. Vérifiez votre connexion, puis réessayez.'

/** Traduit une erreur Supabase en message compréhensible, sans jargon technique. */
export function friendlyDataError(err: unknown, fallback = GENERIC_ERROR): string {
  const raw = (err instanceof Error ? err.message : String(err ?? '')).toLowerCase()
  if (!raw) return fallback
  if (raw.includes('violates row-level security') || raw.includes('insufficient'))
    return "Vous n'êtes pas autorisé·e à faire cette action."
  if (raw.includes('check constraint') || raw.includes('violates check'))
    return 'Une des valeurs saisies dépasse la limite autorisée. Raccourcissez le texte concerné.'
  if (raw.includes('failed to fetch') || raw.includes('network'))
    return 'Impossible de joindre le serveur. Vérifiez votre connexion Internet.'
  return fallback
}

interface TableState<T> {
  items: T[]
  loading: boolean
  error: string | null
  reload: () => Promise<void>
}

/** Charge une table entière, triée. Le volume attendu au démarrage est très faible. */
function useTable<T>(table: string, orderColumn: string, ascending: boolean): TableState<T> {
  const { session } = useAuth()
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!isSupabaseConfigured || !session) {
      setItems([])
      setLoading(false)
      return
    }
    try {
      const { data, error: queryError } = await getSupabase()
        .from(table)
        .select('*')
        .order(orderColumn, { ascending })
      if (queryError) throw queryError
      setItems((data ?? []) as T[])
      setError(null)
    } catch (err) {
      setError(friendlyDataError(err))
    } finally {
      setLoading(false)
    }
  }, [table, orderColumn, ascending, session])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}

/** Écritures génériques sur une table, avec messages d'erreur en français. */
function writer(table: string) {
  return {
    async create(values: Record<string, unknown>) {
      const { error } = await getSupabase().from(table).insert(values)
      if (error) throw new Error(friendlyDataError(error, "L'enregistrement a échoué. Réessayez."))
    },
    async update(id: string, values: Record<string, unknown>) {
      const { error } = await getSupabase().from(table).update(values).eq('id', id)
      if (error) throw new Error(friendlyDataError(error, 'La modification a échoué. Réessayez.'))
    },
    async remove(id: string) {
      const { error } = await getSupabase().from(table).delete().eq('id', id)
      if (error) throw new Error(friendlyDataError(error, 'La suppression a échoué. Réessayez.'))
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Fil du Cocon                                                                */
/* -------------------------------------------------------------------------- */

export function usePosts() {
  const { profile } = useAuth()
  const posts = useTable<Post>('posts', 'created_at', false)
  const comments = useTable<PostComment>('post_comments', 'created_at', true)
  const supports = useTable<PostSupport>('post_supports', 'created_at', true)

  const reloadAll = useCallback(async () => {
    await Promise.all([posts.reload(), comments.reload(), supports.reload()])
  }, [posts, comments, supports])

  const commentsByPost = useMemo(() => {
    const map = new Map<string, PostComment[]>()
    for (const c of comments.items) map.set(c.post_id, [...(map.get(c.post_id) ?? []), c])
    return map
  }, [comments.items])

  const supportsByPost = useMemo(() => {
    const map = new Map<string, PostSupport[]>()
    for (const s of supports.items) map.set(s.post_id, [...(map.get(s.post_id) ?? []), s])
    return map
  }, [supports.items])

  const api = writer('posts')

  return {
    posts: posts.items,
    loading: posts.loading || comments.loading || supports.loading,
    error: posts.error ?? comments.error ?? supports.error,
    reload: reloadAll,
    commentsOf: (postId: string) => commentsByPost.get(postId) ?? [],
    supportsOf: (postId: string) => supportsByPost.get(postId) ?? [],
    isSupportedByMe: (postId: string) =>
      (supportsByPost.get(postId) ?? []).some((s) => s.member_id === profile?.id),

    async createPost(values: { category: string; title: string; body: string }) {
      if (!profile) throw new Error('Vous devez être connecté·e.')
      await api.create({ ...values, author_id: profile.id })
      await reloadAll()
    },
    async updatePost(id: string, values: { category?: string; title?: string; body?: string }) {
      await api.update(id, values)
      await reloadAll()
    },
    async deletePost(id: string) {
      await api.remove(id)
      await reloadAll()
    },
    async addComment(postId: string, body: string) {
      if (!profile) throw new Error('Vous devez être connecté·e.')
      const { error } = await getSupabase()
        .from('post_comments')
        .insert({ post_id: postId, author_id: profile.id, body })
      if (error) throw new Error(friendlyDataError(error, "Le commentaire n'a pas pu être ajouté."))
      await comments.reload()
    },
    async deleteComment(id: string) {
      const { error } = await getSupabase().from('post_comments').delete().eq('id', id)
      if (error) throw new Error(friendlyDataError(error, "Le commentaire n'a pas pu être retiré."))
      await comments.reload()
    },
    async toggleSupport(postId: string) {
      if (!profile) throw new Error('Vous devez être connecté·e.')
      const supabase = getSupabase()
      const mine = (supportsByPost.get(postId) ?? []).some((s) => s.member_id === profile.id)
      const { error } = mine
        ? await supabase
            .from('post_supports')
            .delete()
            .eq('post_id', postId)
            .eq('member_id', profile.id)
        : await supabase.from('post_supports').insert({ post_id: postId, member_id: profile.id })
      if (error) throw new Error(friendlyDataError(error, "Le soutien n'a pas pu être enregistré."))
      await supports.reload()
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Projets & Synergies                                                         */
/* -------------------------------------------------------------------------- */

export function useProjects() {
  const { profile } = useAuth()
  const projects = useTable<Project>('projects', 'created_at', false)
  const api = writer('projects')

  return {
    projects: projects.items,
    loading: projects.loading,
    error: projects.error,
    reload: projects.reload,
    async createProject(values: {
      kind: string
      title: string
      summary: string
      help_wanted: string
    }) {
      if (!profile) throw new Error('Vous devez être connecté·e.')
      await api.create({ ...values, author_id: profile.id })
      await projects.reload()
    },
    async updateProject(id: string, values: Record<string, unknown>) {
      await api.update(id, values)
      await projects.reload()
    },
    async deleteProject(id: string) {
      await api.remove(id)
      await projects.reload()
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Boîte à outils                                                              */
/* -------------------------------------------------------------------------- */

export function useResources() {
  const { profile } = useAuth()
  const resources = useTable<Resource>('resources', 'created_at', false)
  const api = writer('resources')

  return {
    resources: resources.items,
    loading: resources.loading,
    error: resources.error,
    reload: resources.reload,
    async createResource(values: {
      title: string
      description: string
      category: string
      url: string
    }) {
      if (!profile) throw new Error('Vous devez être connecté·e.')
      await api.create({ ...values, author_id: profile.id })
      await resources.reload()
    },
    async updateResource(id: string, values: Record<string, unknown>) {
      await api.update(id, values)
      await resources.reload()
    },
    async deleteResource(id: string) {
      await api.remove(id)
      await resources.reload()
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Agenda                                                                      */
/* -------------------------------------------------------------------------- */

export function useEvents() {
  const { profile } = useAuth()
  const events = useTable<CocoonEvent>('events', 'starts_at', true)
  const attendees = useTable<EventAttendee>('event_attendees', 'created_at', true)
  const api = writer('events')

  const attendeesByEvent = useMemo(() => {
    const map = new Map<string, EventAttendee[]>()
    for (const a of attendees.items) map.set(a.event_id, [...(map.get(a.event_id) ?? []), a])
    return map
  }, [attendees.items])

  const reloadAll = useCallback(async () => {
    await Promise.all([events.reload(), attendees.reload()])
  }, [events, attendees])

  return {
    events: events.items,
    loading: events.loading || attendees.loading,
    error: events.error ?? attendees.error,
    reload: reloadAll,
    attendeesOf: (eventId: string) => attendeesByEvent.get(eventId) ?? [],
    isAttending: (eventId: string) =>
      (attendeesByEvent.get(eventId) ?? []).some((a) => a.member_id === profile?.id),

    async createEvent(values: Record<string, unknown>) {
      if (!profile) throw new Error('Vous devez être connecté·e.')
      await api.create({ ...values, organizer_id: profile.id })
      await reloadAll()
    },
    async updateEvent(id: string, values: Record<string, unknown>) {
      await api.update(id, values)
      await reloadAll()
    },
    async deleteEvent(id: string) {
      await api.remove(id)
      await reloadAll()
    },
    async toggleAttendance(eventId: string) {
      if (!profile) throw new Error('Vous devez être connecté·e.')
      const supabase = getSupabase()
      const mine = (attendeesByEvent.get(eventId) ?? []).some((a) => a.member_id === profile.id)
      const { error } = mine
        ? await supabase
            .from('event_attendees')
            .delete()
            .eq('event_id', eventId)
            .eq('member_id', profile.id)
        : await supabase
            .from('event_attendees')
            .insert({ event_id: eventId, member_id: profile.id })
      if (error)
        throw new Error(friendlyDataError(error, "Votre choix n'a pas pu être enregistré."))
      await attendees.reload()
    },
  }
}
