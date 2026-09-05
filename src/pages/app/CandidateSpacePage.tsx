import { useNavigate } from 'react-router-dom'
import { Alert, Badge, Button, Card, Logo } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'
import { STATUS_LABELS } from '../../lib/roles'

/** Espace d'un·e candidat·e : statut de sa candidature, sans accès au Cocon. */
export default function CandidateSpacePage() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-3xl">Votre candidature</h1>
          {profile && <Badge tone="ochre">{STATUS_LABELS[profile.status]}</Badge>}
        </div>
        <p className="mt-3 text-ink-soft">
          Votre accès est créé. Le Cocon s’ouvrira à vous une fois votre candidature examinée et
          validée par les trois fondatrices.
        </p>
        <Alert tone="info" className="mt-5" title="Formulaire de candidature">
          Le formulaire sera disponible ici à l’étape 4 de la construction. Il ne vous demandera
          aucune donnée médicale, aucun diagnostic ni aucune justification liée à la santé.
        </Alert>
        <ul className="mt-5 space-y-2 text-ink-soft">
          <li>• Vous pourrez modifier votre candidature tant qu’elle n’a pas été examinée.</li>
          <li>• Vous serez informé·e de la décision par courriel et dans cet espace.</li>
          <li>
            • En cas d’acceptation, vous lirez la charte puis créerez votre fiche « Mon Univers ».
          </li>
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate('/app/profil')}>
            Indiquer mon prénom
          </Button>
          <Button
            variant="ghost"
            onClick={async () => {
              await signOut()
              navigate('/', { replace: true })
            }}
          >
            Se déconnecter
          </Button>
        </div>
      </Card>
    </div>
  )
}
