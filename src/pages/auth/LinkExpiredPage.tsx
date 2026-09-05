import { Link, useLocation } from 'react-router-dom'
import { ButtonLink, Card, Logo } from '../../components/ui'

export default function LinkExpiredPage() {
  const location = useLocation() as { state?: { message?: string } }
  const message = location.state?.message ?? 'Ce lien de connexion a expiré ou a déjà été utilisé.'
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 flex justify-center">
        <Logo size="lg" />
      </div>
      <Card className="text-center">
        <h1 className="text-3xl">Ce lien n’est plus valable</h1>
        <p className="mt-3 text-ink-soft">{message}</p>
        <p className="mt-2 text-sm text-ink-muted">
          Chaque lien fonctionne une seule fois, pendant une heure, et doit être ouvert sur
          l’appareil où il a été demandé.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <ButtonLink to="/connexion?raison=expire">Demander un nouveau lien</ButtonLink>
          <Link to="/" className="text-sm">
            Retour à l’accueil
          </Link>
        </div>
      </Card>
    </div>
  )
}
