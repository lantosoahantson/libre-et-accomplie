/**
 * Réseaux sociaux : normalisation et affichage.
 *
 * Règles issues du cahier des charges :
 * - un seul champ Instagram principal, jamais de second compte ;
 * - accepter « @identifiant », « instagram.com/identifiant » ou une adresse complète ;
 * - toujours produire un lien cliquable ;
 * - jusqu'à huit autres réseaux, librement ajoutés et supprimés.
 */

export const MAX_OTHER_SOCIAL_LINKS = 8

export type SocialNetwork =
  'threads' | 'facebook' | 'linkedin' | 'tiktok' | 'youtube' | 'pinterest' | 'other'

export interface SocialLink {
  id: string
  network: SocialNetwork
  /** Libellé personnalisé, facultatif. */
  label: string
  url: string
}

export const NETWORK_LABELS: Record<SocialNetwork, string> = {
  threads: 'Threads',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
  other: 'Autre',
}

/** Domaine attendu par réseau, utilisé pour reconnaître un lien collé. */
const NETWORK_HOSTS: Record<SocialNetwork, string[]> = {
  threads: ['threads.net', 'threads.com'],
  facebook: ['facebook.com', 'fb.com', 'fb.me'],
  linkedin: ['linkedin.com'],
  tiktok: ['tiktok.com'],
  youtube: ['youtube.com', 'youtu.be'],
  pinterest: ['pinterest.com', 'pinterest.fr'],
  other: [],
}

const INSTAGRAM_HOSTS = ['instagram.com', 'instagr.am']

/** Un identifiant Instagram valide : lettres, chiffres, point, tiret bas, 30 caractères au plus. */
const HANDLE_RE = /^[A-Za-z0-9._]{1,30}$/

function stripWrapping(value: string): string {
  return value
    .trim()
    .replace(/^[<(]+/, '')
    .replace(/[>)]+$/, '')
}

/** Retire le protocole, « www. » et la barre oblique finale, pour comparer des adresses. */
function hostAndPath(value: string): { host: string; path: string } | null {
  const withProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `https://${value}`
  try {
    const url = new URL(withProtocol)
    return {
      host: url.hostname.replace(/^www\./i, '').toLowerCase(),
      path: url.pathname.replace(/^\/+|\/+$/g, ''),
    }
  } catch {
    return null
  }
}

/**
 * Normalise une saisie Instagram en identifiant nu, sans arobase ni adresse.
 * Renvoie null si la saisie est vide, et une erreur explicite si elle est invalide.
 */
export function parseInstagram(input: string): { handle: string | null; error: string | null } {
  const raw = stripWrapping(input)
  if (!raw) return { handle: null, error: null }

  // Forme « @identifiant »
  if (raw.startsWith('@')) {
    const handle = raw.slice(1).replace(/\/+$/, '')
    return HANDLE_RE.test(handle)
      ? { handle, error: null }
      : {
          handle: null,
          error: "Cet identifiant Instagram n'est pas valide. Exemple attendu : @le.cocon",
        }
  }

  // Forme adresse, avec ou sans protocole
  if (raw.includes('/') || raw.includes('.')) {
    const parsed = hostAndPath(raw)
    if (parsed && INSTAGRAM_HOSTS.includes(parsed.host)) {
      const handle = parsed.path.split('/')[0] ?? ''
      return HANDLE_RE.test(handle)
        ? { handle, error: null }
        : { handle: null, error: "Cette adresse Instagram ne contient pas d'identifiant lisible." }
    }
    if (parsed && parsed.host && !INSTAGRAM_HOSTS.includes(parsed.host) && raw.includes('/')) {
      return { handle: null, error: 'Cette adresse ne semble pas être un profil Instagram.' }
    }
  }

  // Forme « identifiant » nu
  const handle = raw.replace(/\/+$/, '')
  return HANDLE_RE.test(handle)
    ? { handle, error: null }
    : {
        handle: null,
        error: "Cet identifiant Instagram n'est pas valide. Exemple attendu : @le.cocon",
      }
}

/** Adresse cliquable d'un profil Instagram à partir de l'identifiant enregistré. */
export function instagramUrl(handle: string | null | undefined): string | null {
  const h = (handle ?? '').replace(/^@/, '').trim()
  return HANDLE_RE.test(h) ? `https://instagram.com/${h}` : null
}

/** Affichage court d'un identifiant Instagram. */
export function instagramDisplay(handle: string | null | undefined): string | null {
  const h = (handle ?? '').replace(/^@/, '').trim()
  return h ? `@${h}` : null
}

/**
 * Normalise une adresse quelconque : ajoute le protocole lorsqu'il manque,
 * refuse ce qui ne ressemble pas à une adresse.
 */
export function normalizeUrl(input: string): { url: string | null; error: string | null } {
  const raw = stripWrapping(input)
  if (!raw) return { url: null, error: null }

  if (/^(javascript|data|vbscript):/i.test(raw)) {
    return { url: null, error: "Ce type d'adresse n'est pas autorisé." }
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw.replace(/^\/+/, '')}`
  let url: URL
  try {
    url = new URL(withProtocol)
  } catch {
    return { url: null, error: 'Cette adresse est incomplète. Exemple attendu : monsite.fr' }
  }
  if (!url.hostname.includes('.') || url.hostname.endsWith('.')) {
    return { url: null, error: 'Cette adresse est incomplète. Exemple attendu : monsite.fr' }
  }
  return { url: url.toString().replace(/\/$/, ''), error: null }
}

/** Devine le réseau à partir d'une adresse collée, pour préremplir le choix. */
export function guessNetwork(input: string): SocialNetwork {
  const parsed = hostAndPath(stripWrapping(input))
  if (!parsed) return 'other'
  for (const [network, hosts] of Object.entries(NETWORK_HOSTS) as [SocialNetwork, string[]][]) {
    if (hosts.some((h) => parsed.host === h || parsed.host.endsWith(`.${h}`))) return network
  }
  return 'other'
}

/** Texte affiché pour un lien : le libellé choisi, sinon le nom du réseau. */
export function socialLinkLabel(link: Pick<SocialLink, 'network' | 'label'>): string {
  return link.label.trim() || NETWORK_LABELS[link.network]
}

/** Adresse raccourcie pour l'affichage, sans protocole ni barre finale. */
export function shortUrl(url: string): string {
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/$/, '')
}
