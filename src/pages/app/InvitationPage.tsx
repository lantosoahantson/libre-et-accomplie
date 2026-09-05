import { useNavigate } from 'react-router-dom'
import { Alert, Button, Card, Logo } from '../../components/ui'
import { useAuth } from '../../hooks/useAuth'

/** Personne accompagnée invitée : explication du cercle, activation à l'étape 4 (charte). */
export default function InvitationPage() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex justify-center">
        <Logo size="lg" />
      </div>
      <Card>
        <h1 className="text-3xl">Bienvenue, vous êtes invité·e</h1>
        <p className="mt-3 text-ink-soft">
          Un·e professionnel·le du Cocon vous a invité·e à rejoindre le cercle des personnes
          accompagnées. Vous y trouverez des contenus éducatifs, certaines ressources, certains
          ateliers et les fiches des professionnel·les qui ont choisi de s’y rendre visibles.
        </p>
        <Alert tone="info" className="mt-5" title="Prochaine étape">
          La lecture et l’acceptation de la charte activeront votre accès. Cette étape arrive avec
          la gouvernance (étape 4).
        </Alert>
        <Button
          variant="ghost"
          className="mt-6"
          onClick={async () => {
            await signOut()
            navigate('/', { replace: true })
          }}
        >
          Se déconnecter
        </Button>
      </Card>
    </div>
  )
}
