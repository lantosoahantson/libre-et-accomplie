import type { MemberRole, MemberStatus, Profile } from './database.types'

/** Libellés français des rôles et statuts. */
export const ROLE_LABELS: Record<MemberRole, string> = {
  candidate: 'Candidat·e',
  professional: 'Professionnel·le',
  accompanied: 'Personne accompagnée',
  founder: 'Fondatrice',
}

export const STATUS_LABELS: Record<MemberStatus, string> = {
  invited: 'Invité·e',
  pending: 'Candidature en attente',
  active: 'Actif·ve',
  paused: 'En pause',
  suspended: 'Suspendu·e',
  left: 'Sorti·e du groupe',
  refused: 'Candidature refusée',
}

export type Access =
  'visitor' | 'candidate' | 'invited' | 'blocked' | 'accompanied' | 'professional' | 'founder'

type ProfileLike = Pick<Profile, 'role' | 'status'> | null | undefined

/**
 * Détermine le niveau d'accès effectif à partir du rôle et du statut.
 * Cette logique reflète les politiques RLS ; elle sert uniquement à guider la
 * navigation. La protection réelle des données est faite côté base.
 */
export function accessOf(profile: ProfileLike): Access {
  if (!profile) return 'visitor'
  const { role, status } = profile
  if (status === 'suspended' || status === 'left' || status === 'refused') return 'blocked'
  if (status === 'invited') return 'invited'
  if (status === 'pending') return 'candidate'
  // status active ou paused
  if (role === 'founder') return 'founder'
  if (role === 'professional') return 'professional'
  if (role === 'accompanied') return 'accompanied'
  return 'candidate'
}

/** Le membre peut-il entrer dans le Cocon (espaces réservés aux membres) ? */
export function canEnterCocon(profile: ProfileLike): boolean {
  const a = accessOf(profile)
  return a === 'professional' || a === 'founder' || a === 'accompanied'
}

/** Accès aux contenus réservés aux professionnel·les. */
export function isProfessionalCircle(profile: ProfileLike): boolean {
  const a = accessOf(profile)
  return a === 'professional' || a === 'founder'
}

export function isFounder(profile: ProfileLike): boolean {
  return accessOf(profile) === 'founder'
}

/** Page d'atterrissage après connexion selon le rôle et le statut. */
export function homeRouteFor(profile: ProfileLike): string {
  switch (accessOf(profile)) {
    case 'visitor':
      return '/connexion'
    case 'candidate':
      return '/app/candidature'
    case 'invited':
      return '/app/invitation'
    case 'blocked':
      return '/app/acces-restreint'
    default:
      return '/app'
  }
}

/** Zones de l'application et qui peut y accéder. */
export type Zone = 'cocon' | 'professional' | 'founder' | 'candidate' | 'invited' | 'blocked'

export function canAccessZone(profile: ProfileLike, zone: Zone): boolean {
  const a = accessOf(profile)
  switch (zone) {
    case 'cocon':
      return canEnterCocon(profile)
    case 'professional':
      return a === 'professional' || a === 'founder'
    case 'founder':
      return a === 'founder'
    case 'candidate':
      return a === 'candidate'
    case 'invited':
      return a === 'invited'
    case 'blocked':
      return a === 'blocked'
  }
}

/** Prénom affiché, avec repli doux si le profil est encore vide. */
export function displayName(
  profile: Pick<Profile, 'first_name' | 'last_name'> | null | undefined,
): string {
  if (!profile) return ''
  const full = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim()
  return full
}
