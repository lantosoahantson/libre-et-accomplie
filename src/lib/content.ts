/**
 * Contenus de la communauté : types partagés et libellés français.
 * Ces contenus sont enregistrés dans Supabase et visibles par tous les membres
 * connectés. Aucun contenu n'est fictif.
 */

export type PostCategory = 'partage' | 'question' | 'retour' | 'victoire' | 'soutien' | 'actualite'

export const POST_CATEGORIES: { value: PostCategory; label: string; hint: string }[] = [
  { value: 'partage', label: 'Partage ou réflexion', hint: 'Une pensée, un ressenti, une lecture' },
  { value: 'question', label: 'Question', hint: 'Vous cherchez une réponse ou un avis' },
  { value: 'retour', label: 'Demande de retour', hint: 'Vous souhaitez un regard extérieur' },
  { value: 'victoire', label: 'Petite victoire', hint: 'Un pas franchi, même minuscule' },
  { value: 'soutien', label: 'Besoin de soutien', hint: 'Un moment plus difficile' },
  { value: 'actualite', label: 'Actualité', hint: 'Une annonce à partager' },
]

export const POST_CATEGORY_LABELS = Object.fromEntries(
  POST_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<PostCategory, string>

/** Teinte de la pastille. Aucune catégorie n'est mise en avant par rapport aux autres. */
export const POST_CATEGORY_TONE: Record<PostCategory, string> = {
  partage: 'bg-sage-100 text-forest-700',
  question: 'bg-sand text-ink-soft',
  retour: 'bg-sand text-ink-soft',
  victoire: 'bg-ochre-100 text-ochre-500',
  soutien: 'bg-blush-100 text-blush-400',
  actualite: 'bg-sage-50 text-forest-600',
}

export type ProjectKind = 'avis' | 'test' | 'competence' | 'collaboration'

export const PROJECT_KINDS: { value: ProjectKind; label: string; short: string }[] = [
  { value: 'avis', label: 'Je cherche un avis', short: 'Avis' },
  { value: 'test', label: 'Je cherche des personnes pour tester', short: 'Test' },
  { value: 'competence', label: 'Je cherche une compétence', short: 'Compétence' },
  { value: 'collaboration', label: 'Je cherche une collaboration', short: 'Collaboration' },
]

export const PROJECT_KIND_LABELS = Object.fromEntries(
  PROJECT_KINDS.map((k) => [k.value, k.label]),
) as Record<ProjectKind, string>

export type ProjectStatus = 'ouvert' | 'cloture'

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  ouvert: 'Ouvert',
  cloture: 'Clôturé',
}

export const RESOURCE_CATEGORIES = [
  'Outils',
  'Comptes rendus',
  "Supports d'ateliers",
  'Replays',
  'Liens utiles',
  'Formulaires',
] as const

export type ResourceCategory = (typeof RESOURCE_CATEGORIES)[number]

export type PresenceMode = 'presentiel' | 'distance' | 'les-deux'

export const PRESENCE_LABELS: Record<PresenceMode, string> = {
  presentiel: 'En présentiel',
  distance: 'À distance',
  'les-deux': 'Présentiel et distance',
}

/* -------------------------------------------------------------------------- */
/* Lignes telles qu'elles sont enregistrées                                    */
/* -------------------------------------------------------------------------- */

export interface Post {
  id: string
  author_id: string
  category: PostCategory
  title: string
  body: string
  created_at: string
  updated_at: string
}

export interface PostComment {
  id: string
  post_id: string
  author_id: string
  body: string
  created_at: string
}

export interface PostSupport {
  post_id: string
  member_id: string
}

export interface Project {
  id: string
  author_id: string
  kind: ProjectKind
  title: string
  summary: string
  help_wanted: string
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface Resource {
  id: string
  author_id: string
  title: string
  description: string
  category: string
  url: string
  created_at: string
  updated_at: string
}

export interface CocoonEvent {
  id: string
  organizer_id: string
  title: string
  description: string
  host_name: string
  starts_at: string
  duration_min: number
  location: string
  created_at: string
  updated_at: string
}

export interface EventAttendee {
  event_id: string
  member_id: string
}
