import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, PageHeader } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { STATUS_LABELS, ROLE_LABELS, canEnterCocon } from '../../lib/roles'

export default function SettingsPage() {
  const { profile, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const run = async (key: string, fn: () => Promise<unknown>, okText: string) => {
    setBusy(key)
    setMsg(null)
    try {
      await fn()
      setMsg({ tone: 'success', text: okText })
    } catch (e) {
      setMsg({ tone: 'error', text: e instanceof Error ? e.message : 'Une erreur est survenue.' })
    } finally {
      setBusy(null)
    }
  }

  const member = canEnterCocon(profile)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow="Paramètres" title="Mon compte" />

      {profile && (
        <Card>
          <h2 className="text-xl">Mon statut</h2>
          <p className="mt-1 text-ink-soft">
            {ROLE_LABELS[profile.role]} · {STATUS_LABELS[profile.status]}
          </p>
        </Card>
      )}

      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

      {member && (
        <Card>
          <h2 className="text-xl">Faire une pause</h2>
          <p className="mt-1 text-ink-soft">
            En pause, vous restez membre : votre fiche est masquée de l’annuaire et la majorité des
            notifications sont désactivées. Vous reprenez quand vous le souhaitez.
          </p>
          {profile?.status === 'paused' ? (
            <Button
              className="mt-4"
              variant="secondary"
              loading={busy === 'pause'}
              onClick={() =>
                run(
                  'pause',
                  () => updateProfile({ status: 'active', is_hidden: false }),
                  'Vous avez repris votre place dans le Cocon.',
                )
              }
            >
              Reprendre
            </Button>
          ) : (
            <Button
              className="mt-4"
              variant="secondary"
              loading={busy === 'pause'}
              onClick={() =>
                run(
                  'pause',
                  () => updateProfile({ status: 'paused', is_hidden: true }),
                  'Vous êtes en pause. Prenez soin de vous.',
                )
              }
            >
              Me mettre en pause
            </Button>
          )}
        </Card>
      )}

      {member && (
        <Card>
          <h2 className="text-xl">Visibilité de ma fiche</h2>
          <p className="mt-1 text-ink-soft">
            Masquer temporairement votre fiche sans supprimer votre compte.
          </p>
          <Button
            className="mt-4"
            variant="secondary"
            loading={busy === 'hide'}
            onClick={() =>
              run(
                'hide',
                () => updateProfile({ is_hidden: !profile?.is_hidden }),
                profile?.is_hidden
                  ? 'Votre fiche est de nouveau visible.'
                  : 'Votre fiche est masquée.',
              )
            }
          >
            {profile?.is_hidden ? 'Rendre ma fiche visible' : 'Masquer ma fiche'}
          </Button>
        </Card>
      )}

      <Card>
        <h2 className="text-xl">Notifications</h2>
        <p className="mt-1 text-ink-soft">
          Les réglages détaillés (dans l’application, par courriel, rappels, pause) arrivent à
          l’étape 4.
        </p>
      </Card>

      <Card>
        <h2 className="text-xl">Mes données</h2>
        <p className="mt-1 text-ink-soft">
          Demander une copie de vos informations ou supprimer votre compte : ces actions seront
          proposées ici à l’étape 5.
        </p>
      </Card>

      <Card>
        <h2 className="text-xl">Se déconnecter</h2>
        <Button
          className="mt-4"
          variant="ghost"
          loading={busy === 'out'}
          onClick={() =>
            run(
              'out',
              async () => {
                await signOut()
                navigate('/', { replace: true })
              },
              'À bientôt.',
            )
          }
        >
          Se déconnecter de cet appareil
        </Button>
      </Card>
    </div>
  )
}
