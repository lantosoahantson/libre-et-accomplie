import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  ButtonLink,
  EmptyState,
  PageHeader,
  SearchField,
  Spinner,
} from '../../components/ui'
import { MemberCard, MemberUniverse } from '../../components/MemberUniverse'
import { searchMembers, useDirectory } from '../../hooks/useDirectory'
import { useAuth } from '../../hooks/useAuth'

export default function TalentsPage() {
  const { visible, loading, error } = useDirectory()
  const [query, setQuery] = useState('')

  const results = useMemo(() => searchMembers(visible, query), [visible, query])

  return (
    <div>
      <PageHeader
        eyebrow="Cercle des Talents"
        title="Le Cercle des Talents"
        intro="L’annuaire privé du Cocon. Chaque membre y présente son univers, ses compétences et ce sur quoi il ou elle peut contribuer."
      />

      {error && (
        <Alert tone="error" className="mb-5">
          {error}
        </Alert>
      )}

      <div className="mb-6">
        <SearchField
          id="recherche-talents"
          value={query}
          onChange={setQuery}
          label="Rechercher un membre"
          placeholder="Un prénom, une activité, une compétence, une ville…"
        />
      </div>

      {loading ? (
        <div className="py-10 text-center">
          <Spinner label="Chargement de l’annuaire…" />
        </div>
      ) : results.length === 0 ? (
        <EmptyState
          icon="🤝"
          title={query ? 'Aucun membre ne correspond' : 'L’annuaire est encore vide'}
        >
          {query ? (
            <>
              <p>Essayez un autre mot, ou effacez votre recherche.</p>
              <Button variant="secondary" className="mt-4" onClick={() => setQuery('')}>
                Effacer la recherche
              </Button>
            </>
          ) : (
            <p>
              Les fiches des membres apparaîtront ici. Vous pouvez déjà compléter la vôtre depuis{' '}
              <Link to="/app/profil">Mon Univers</Link>.
            </p>
          )}
        </EmptyState>
      ) : (
        <>
          <p className="mb-4 text-sm text-ink-muted">
            {results.length} membre{results.length > 1 ? 's' : ''}
            {query ? ' correspondent à votre recherche' : ' dans le Cercle'}
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </ul>
        </>
      )}

      <p className="mt-8 text-sm text-ink-muted">
        L’annuaire reste privé. Aucune adresse électronique de connexion n’y figure, et un membre
        peut masquer sa fiche à tout moment depuis ses paramètres.
      </p>
    </div>
  )
}

/** Fiche détaillée d'un membre. */
export function MemberPage() {
  const { memberId } = useParams()
  const { visible, loading } = useDirectory()
  const { profile } = useAuth()
  const member = visible.find((m) => m.id === memberId)

  if (loading) {
    return (
      <div className="py-10 text-center">
        <Spinner label="Chargement de la fiche…" />
      </div>
    )
  }

  if (!member) {
    return (
      <div>
        <Link to="/app/talents" className="mb-4 inline-block text-sm">
          ← Retour au Cercle des Talents
        </Link>
        <EmptyState icon="🍃" title="Cette fiche n’est pas accessible">
          Elle est peut-être masquée par son autrice, ou elle n’existe plus.
        </EmptyState>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/app/talents" className="mb-4 inline-block text-sm">
        ← Retour au Cercle des Talents
      </Link>
      <MemberUniverse member={member} />
      {profile?.id === member.id && (
        <div className="mt-4">
          <ButtonLink to="/app/profil" variant="secondary">
            Modifier ma fiche
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
