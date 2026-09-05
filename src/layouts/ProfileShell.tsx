import { Link, Outlet } from 'react-router-dom'
import AppLayout from './AppLayout'
import { useAuth } from '../hooks/useAuth'
import { canEnterCocon, homeRouteFor } from '../lib/roles'
import { Logo } from '../components/ui'

/**
 * La fiche « Mon Univers » s'affiche dans la mise en page complète pour un membre
 * du Cocon, et dans une page simple pour un·e candidat·e ou une personne invitée.
 */
export default function ProfileShell() {
  const { profile } = useAuth()
  if (canEnterCocon(profile)) return <AppLayout />
  return (
    <div className="mx-auto min-h-dvh max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Logo />
        <Link to={homeRouteFor(profile)} className="text-sm">
          ← Retour à mon espace
        </Link>
      </div>
      <Outlet />
    </div>
  )
}
