import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Logo } from '../components/ui'
import {
  IconCalendar,
  IconFeed,
  IconHome,
  IconLogout,
  IconPeople,
  IconSettings,
  IconShield,
  IconSprout,
  IconToolbox,
  IconUser,
} from '../components/icons'
import { useAuth } from '../hooks/useAuth'
import { ROLE_LABELS, STATUS_LABELS, accessOf, displayName, isFounder } from '../lib/roles'

/** Les cinq entrées principales (barre inférieure sur mobile, latérale sur ordinateur). */
const mainNav = [
  { to: '/app', label: 'Accueil', icon: IconHome, end: true },
  { to: '/app/fil', label: 'Fil du Cocon', short: 'Fil', icon: IconFeed },
  { to: '/app/projets', label: 'Projets & Synergies', short: 'Projets', icon: IconSprout },
  { to: '/app/talents', label: 'Cercle des Talents', short: 'Talents', icon: IconPeople },
  { to: '/app/outils', label: 'Boîte à Outils', short: 'Outils', icon: IconToolbox },
]

const secondaryNav = [
  { to: '/app/calendrier', label: 'Calendrier', icon: IconCalendar },
  { to: '/app/profil', label: 'Mon Univers', icon: IconUser },
  { to: '/app/parametres', label: 'Paramètres', icon: IconSettings },
]

const navClass = (isActive: boolean) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium no-underline transition-colors ${
    isActive
      ? 'bg-sage-100 text-forest-700'
      : 'text-ink-soft hover:bg-sage-50 hover:text-forest-700'
  }`

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [signingOut, setSigningOut] = useState(false)
  const founder = isFounder(profile)
  const access = accessOf(profile)
  const name = displayName(profile)

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      navigate('/', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <div className="flex min-h-dvh">
      {/* Navigation latérale (ordinateur) */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r border-sand/70 bg-cream-light px-4 py-5 md:flex"
        aria-label="Navigation principale"
      >
        <Link to="/app" className="mb-6 block px-2 no-underline">
          <Logo />
        </Link>
        <nav className="flex flex-col gap-1">
          {mainNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => navClass(isActive)}>
              <Icon className="h-5 w-5 shrink-0" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="my-4 border-t border-sand/70" />
        <nav className="flex flex-col gap-1" aria-label="Navigation secondaire">
          {secondaryNav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => navClass(isActive)}>
              <Icon className="h-5 w-5 shrink-0" /> {label}
            </NavLink>
          ))}
          {founder && (
            <NavLink to="/app/gouvernance" className={({ isActive }) => navClass(isActive)}>
              <IconShield className="h-5 w-5 shrink-0" /> Espace fondatrices
            </NavLink>
          )}
        </nav>
        <div className="mt-auto pt-6">
          <div className="rounded-xl bg-sage-50 p-3 text-sm">
            <p className="font-semibold text-forest-700">{name || 'Bienvenue'}</p>
            {profile && (
              <p className="text-ink-muted">
                {ROLE_LABELS[profile.role]} · {STATUS_LABELS[profile.status]}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 font-medium text-ink-soft hover:bg-sage-50 hover:text-forest-700 disabled:opacity-60"
          >
            <IconLogout className="h-5 w-5" /> {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barre supérieure (mobile) */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-sand/70 bg-cream/90 px-4 py-3 backdrop-blur md:hidden">
          <Link to="/app" className="no-underline">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-1">
            {founder && (
              <Link
                to="/app/gouvernance"
                className="rounded-lg p-2 text-forest-700 hover:bg-sage-50"
                aria-label="Espace fondatrices"
              >
                <IconShield />
              </Link>
            )}
            <Link
              to="/app/calendrier"
              className="rounded-lg p-2 text-forest-700 hover:bg-sage-50"
              aria-label="Calendrier"
            >
              <IconCalendar />
            </Link>
            <Link
              to="/app/parametres"
              className="rounded-lg p-2 text-forest-700 hover:bg-sage-50"
              aria-label="Paramètres"
            >
              <IconSettings />
            </Link>
          </div>
        </header>

        {access === 'accompanied' && (
          <div className="bg-blush-100 px-4 py-2 text-center text-sm text-ink-soft">
            Vous êtes dans le cercle des personnes accompagnées : vous voyez uniquement les contenus
            ouverts à ce cercle.
          </div>
        )}
        {profile?.status === 'paused' && (
          <div className="bg-ochre-100 px-4 py-2 text-center text-sm text-ochre-500">
            Vous êtes en pause. Votre fiche est masquée et vos notifications réduites.{' '}
            <Link to="/app/parametres">Reprendre</Link>
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 md:pb-10">
          <Outlet />
        </main>

        {/* Barre de navigation inférieure (mobile) */}
        <nav
          className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-sand bg-cream-light md:hidden"
          aria-label="Navigation principale mobile"
        >
          <ul className="grid grid-cols-5">
            {mainNav.map(({ to, label, short, icon: Icon, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.72rem] font-semibold no-underline ${
                      isActive ? 'text-forest-600' : 'text-ink-muted'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className={`rounded-full px-3 py-0.5 ${isActive ? 'bg-sage-100' : ''}`}>
                        <Icon className="h-6 w-6" />
                      </span>
                      <span>{short ?? label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  )
}
