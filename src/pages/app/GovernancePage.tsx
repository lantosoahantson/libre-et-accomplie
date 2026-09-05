import { useEffect, useState } from 'react'
import { Alert, Badge, Card, PageHeader } from '../../components/ui'
import { useSettings } from '../../hooks/useSettings'
import { getSupabase } from '../../lib/supabase'
import type { MemberRole, MemberStatus, Profile } from '../../lib/database.types'
import { ROLE_LABELS, STATUS_LABELS } from '../../lib/roles'

/** Espace fondatrices — étape 1 : vue d'ensemble des membres et des paramètres (lecture). */
export default function GovernancePage() {
  const { settings, loading } = useSettings()
  const [members, setMembers] = useState<Profile[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSupabase()
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (e) setError('Impossible de charger les membres pour le moment.')
        else setMembers(data as Profile[])
      })
  }, [])

  const count = (pred: (p: Profile) => boolean) => members?.filter(pred).length ?? '…'
  const byStatus = (s: MemberStatus) => count((p) => p.status === s)
  const byRole = (r: MemberRole) =>
    count((p) => p.role === r && (p.status === 'active' || p.status === 'paused'))

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Espace fondatrices"
        title="Gouvernance"
        intro="Vue d’ensemble. Les candidatures, votes, invitations, charte, signalements et modération arrivent à l’étape 4."
      />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Candidatures en attente', byStatus('pending')],
          ['Professionnel·les actifs', byRole('professional')],
          ['Personnes accompagnées', byRole('accompanied')],
          ['En pause', byStatus('paused')],
        ].map(([label, n]) => (
          <Card key={String(label)} as="div">
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="mt-1 font-serif text-3xl text-forest-700">{n}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-xl">Paramètres généraux</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Les points marqués « à valider » restent désactivés tant que les trois fondatrices ne les
          ont pas tranchés ensemble. La modification arrive à l’étape 4.
        </p>
        {loading ? (
          <p className="mt-4 text-ink-muted">Chargement…</p>
        ) : (
          <ul className="mt-4 divide-y divide-sand">
            {Object.values(settings).map((s) => (
              <li
                key={s.key}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-ink">{s.label}</p>
                  {s.description && <p className="text-sm text-ink-muted">{s.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <code className="rounded bg-sand px-2 py-0.5 text-sm text-ink-soft">
                    {s.value === null || s.value === ''
                      ? 'non défini'
                      : typeof s.value === 'object'
                        ? JSON.stringify(s.value)
                        : String(s.value)}
                  </code>
                  {s.needs_validation && <Badge tone="ochre">à valider</Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-xl">Membres</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Aucune adresse électronique n’est affichée ici : l’application n’y a pas accès.
        </p>
        {members === null ? (
          <p className="mt-4 text-ink-muted">Chargement…</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-ink-muted">Aucun membre pour l’instant.</p>
        ) : (
          <ul className="mt-4 divide-y divide-sand">
            {members.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span className="font-medium">
                  {`${m.first_name} ${m.last_name}`.trim() || (
                    <span className="text-ink-muted">Sans prénom</span>
                  )}
                </span>
                <span className="flex gap-2">
                  <Badge tone="neutral">{ROLE_LABELS[m.role]}</Badge>
                  <Badge tone={m.status === 'active' ? 'sage' : 'ochre'}>
                    {STATUS_LABELS[m.status]}
                  </Badge>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
