import { Link } from 'react-router-dom'
import { Alert, Badge, ButtonLink, Card, PageHeader, Spinner } from '../../components/ui'
import { IconCalendar, IconExternal, IconFeed, IconPeople } from '../../components/icons'
import { EventCard } from './AgendaPage'
import { useAuth } from '../../hooks/useAuth'
import { useEvents, usePosts, useResources } from '../../hooks/useContent'
import { useMembers } from '../../hooks/useDirectory'
import { useSettings } from '../../hooks/useSettings'
import { accessOf } from '../../lib/roles'
import { formatDay, isUpcoming, timeAgo } from '../../lib/dates'
import { POST_CATEGORY_LABELS, POST_CATEGORY_TONE } from '../../lib/content'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Douce nuit'
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bel après-midi'
  return 'Bonsoir'
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const { nameOf } = useMembers()
  const feed = usePosts()
  const events = useEvents()
  const resources = useResources()
  const { text } = useSettings()

  const whatsapp = text('whatsapp_link')
  const facebook = text('facebook_link')
  const intention = text('intention_phrase', 'Notre refuge de co-création au rythme du corps.')
  const access = accessOf(profile)

  const upcoming = events.events.filter((e) => isUpcoming(e.starts_at))
  const nextEvent = upcoming[0]
  const latestPosts = feed.posts.slice(0, 3)
  const latestResource = resources.resources[0]
  const loading = feed.loading || events.loading || resources.loading

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Accueil"
        title={`${greeting()}${profile?.first_name ? `, ${profile.first_name}` : ''}`}
        intro={<span className="font-serif italic">« {intention} »</span>}
      />

      {!profile?.first_name && (
        <Alert tone="info" title="Bienvenue dans Le Cocon">
          Prenez un instant pour <Link to="/app/profil">compléter votre fiche</Link>. Rien n’est
          obligatoire, et vous choisissez ce que vous montrez.
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <ButtonLink to="/app/fil" className="w-full">
          <IconFeed className="h-5 w-5" /> Publier
        </ButtonLink>
        <ButtonLink to="/app/talents" variant="secondary" className="w-full">
          <IconPeople className="h-5 w-5" /> Voir les talents
        </ButtonLink>
        <ButtonLink to="/app/agenda" variant="secondary" className="w-full">
          <IconCalendar className="h-5 w-5" /> Voir l’agenda
        </ButtonLink>
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Spinner label="Chargement…" />
        </div>
      ) : (
        <>
          <section aria-labelledby="agenda">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 id="agenda" className="text-2xl">
                Prochains rendez-vous
              </h2>
              <Link to="/app/agenda" className="text-sm font-semibold">
                Voir tout l’agenda →
              </Link>
            </div>
            {nextEvent ? (
              <div className="space-y-3">
                <EventCard event={nextEvent} api={events} />
                {upcoming.length > 1 && (
                  <ul className="divide-y divide-sand rounded-[--radius-card] border border-sand bg-cream-light px-5">
                    {upcoming.slice(1, 3).map((e) => (
                      <li
                        key={e.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-3"
                      >
                        <span className="font-medium text-ink">{e.title}</span>
                        <span className="text-sm text-ink-muted">{formatDay(e.starts_at)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <Card>
                <p className="text-ink-soft">
                  Aucun rendez-vous n’est encore programmé. Vous pouvez inaugurer l’agenda.
                </p>
                <ButtonLink to="/app/agenda" variant="secondary" className="mt-4">
                  Ajouter un événement
                </ButtonLink>
              </Card>
            )}
          </section>

          <section aria-labelledby="publications">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <h2 id="publications" className="text-2xl">
                Dernières publications
              </h2>
              <Link to="/app/fil" className="text-sm font-semibold">
                Ouvrir le Fil →
              </Link>
            </div>
            {latestPosts.length === 0 ? (
              <Card>
                <p className="text-ink-soft">
                  Le Fil est encore silencieux. Vous pouvez y déposer le premier mot.
                </p>
                <ButtonLink to="/app/fil" variant="secondary" className="mt-4">
                  Publier
                </ButtonLink>
              </Card>
            ) : (
              <ul className="grid gap-3 md:grid-cols-3">
                {latestPosts.map((post) => (
                  <Card as="li" key={post.id} className="flex h-full flex-col gap-2">
                    <span
                      className={`w-fit rounded-full px-3 py-0.5 text-sm font-semibold ${POST_CATEGORY_TONE[post.category]}`}
                    >
                      {POST_CATEGORY_LABELS[post.category]}
                    </span>
                    {post.title && <h3 className="text-lg">{post.title}</h3>}
                    <p className="line-clamp-3 text-[0.95rem] text-ink-soft">{post.body}</p>
                    <p className="mt-auto pt-2 text-sm text-ink-muted">
                      {nameOf(post.author_id)} · {timeAgo(post.created_at)}
                    </p>
                  </Card>
                ))}
              </ul>
            )}
          </section>

          {latestResource && (
            <section aria-labelledby="ressource">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <h2 id="ressource" className="text-2xl">
                  Ressource récente
                </h2>
                <Link to="/app/outils" className="text-sm font-semibold">
                  Ouvrir la Boîte à outils →
                </Link>
              </div>
              <Card>
                <Badge tone="sage">{latestResource.category}</Badge>
                <h3 className="mt-2 text-lg">{latestResource.title}</h3>
                {latestResource.description && (
                  <p className="mt-1 text-ink-soft">{latestResource.description}</p>
                )}
              </Card>
            </section>
          )}
        </>
      )}

      {(whatsapp || facebook) && (
        <Card>
          <h2 className="text-xl">Canaux légers</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Pour les annonces importantes et les rappels pendant la phase de test.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            {whatsapp && (
              <ButtonLink to={whatsapp} external variant="secondary">
                Groupe WhatsApp <IconExternal className="h-4 w-4" />
              </ButtonLink>
            )}
            {facebook && (
              <ButtonLink to={facebook} external variant="ghost">
                Facebook <IconExternal className="h-4 w-4" />
              </ButtonLink>
            )}
          </div>
        </Card>
      )}

      {access === 'accompanied' && (
        <Alert tone="info">
          Vous accédez aux contenus ouverts à votre cercle. Aucun démarchage n’est toléré dans Le
          Cocon.
        </Alert>
      )}
    </div>
  )
}
