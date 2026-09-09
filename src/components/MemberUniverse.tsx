import { Link } from 'react-router-dom'
import { Avatar, Badge, Card, ExternalLink, TagList } from './ui'
import type { DirectoryMember } from '../hooks/useDirectory'
import { PRESENCE_LABELS } from '../lib/content'
import { NETWORK_LABELS, instagramDisplay, instagramUrl, shortUrl } from '../lib/social'

/**
 * Fiche « Mon Univers ».
 * L'adresse électronique de connexion n'apparaît nulle part : elle n'est pas
 * dans les données lues par l'annuaire.
 */

/** Tous les liens d'un membre, cliquables sur mobile comme sur ordinateur. */
export function SocialLinks({ member }: { member: DirectoryMember }) {
  const instagram = instagramUrl(member.instagram)
  const hasAny = Boolean(member.website) || Boolean(instagram) || member.socialLinks.length > 0
  if (!hasAny) return null

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-sage-500">
        Où la retrouver
      </h3>
      <ul className="mt-2 flex flex-col gap-1">
        {member.website && (
          <li className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-ink-soft">Site</span>
            <ExternalLink href={member.website}>{shortUrl(member.website)}</ExternalLink>
          </li>
        )}
        {instagram && (
          <li className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-ink-soft">Instagram</span>
            <ExternalLink href={instagram}>{instagramDisplay(member.instagram)}</ExternalLink>
          </li>
        )}
        {member.socialLinks.map((link) => (
          <li key={link.id} className="flex flex-wrap items-baseline gap-x-2">
            {/* Le nom du réseau sert d'étiquette ; le lien affiche le libellé
                personnalisé s'il existe, sinon l'adresse abrégée. */}
            <span className="text-sm font-medium text-ink-soft">
              {NETWORK_LABELS[link.network]}
            </span>
            <ExternalLink href={link.url}>{link.label.trim() || shortUrl(link.url)}</ExternalLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Carte compacte de l'annuaire. */
export function MemberCard({ member }: { member: DirectoryMember }) {
  return (
    <Card as="li" className="flex h-full flex-col gap-3">
      <div className="flex items-start gap-3">
        <Avatar firstName={member.firstName} lastName={member.lastName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg">
              {member.firstName} {member.lastName}
            </h2>
          </div>
          <p className="text-[0.95rem] text-ink-soft">{member.activity || 'Activité à préciser'}</p>
        </div>
      </div>

      {member.headline && <p className="text-ink-soft italic">« {member.headline} »</p>}

      <TagList items={member.skills.slice(0, 4)} />

      <p className="text-sm text-ink-muted">
        {[member.location, PRESENCE_LABELS[member.presence]].filter(Boolean).join(' · ')}
      </p>

      <Link
        to={`/app/talents/${member.id}`}
        className="mt-auto inline-flex min-h-10 items-center font-semibold text-forest-600 no-underline hover:text-forest-700"
      >
        Découvrir son univers →
      </Link>
    </Card>
  )
}

/** Fiche complète. */
export function MemberUniverse({ member }: { member: DirectoryMember }) {
  const sections: { title: string; content: React.ReactNode }[] = [
    member.approach
      ? { title: 'Son approche', content: <p className="text-ink-soft">{member.approach}</p> }
      : null,
    member.skills.length
      ? { title: 'Compétences et savoir-faire', content: <TagList items={member.skills} /> }
      : null,
    member.contributionTopics.length
      ? {
          title: 'Sujets sur lesquels elle peut contribuer',
          content: <TagList items={member.contributionTopics} tone="ochre" />,
        }
      : null,
    member.audience
      ? { title: 'Public accompagné', content: <p className="text-ink-soft">{member.audience}</p> }
      : null,
    member.currentProject
      ? {
          title: 'Projet du moment',
          content: <p className="text-ink-soft">{member.currentProject}</p>,
        }
      : null,
  ].filter(Boolean) as { title: string; content: React.ReactNode }[]

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar firstName={member.firstName} lastName={member.lastName} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl">
              {member.firstName} {member.lastName}
            </h1>
          </div>
          <p className="mt-1 text-lg text-ink-soft">{member.activity || 'Activité à préciser'}</p>
          {member.headline && (
            <p className="mt-3 font-serif text-xl text-forest-600">« {member.headline} »</p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {member.location && <Badge tone="neutral">{member.location}</Badge>}
            <Badge tone="sage">{PRESENCE_LABELS[member.presence]}</Badge>
          </div>
        </div>
      </div>

      {sections.map((s) => (
        <div key={s.title}>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-sage-500">{s.title}</h3>
          <div className="mt-2">{s.content}</div>
        </div>
      ))}

      <SocialLinks member={member} />
    </Card>
  )
}
