import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo, ButtonLink } from '../components/ui'
import { IconMenu } from '../components/icons'
import { useAuth } from '../hooks/useAuth'
import { homeRouteFor } from '../lib/roles'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/nous-rejoindre', label: 'Nous rejoindre' },
  { to: '/charte', label: 'La charte' },
  { to: '/confidentialite', label: 'Confidentialité' },
]

export default function PublicLayout() {
  const [open, setOpen] = useState(false)
  const { session, profile } = useAuth()
  const connected = Boolean(session)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-sand/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="no-underline" aria-label="Le Cocon — accueil">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Navigation publique">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-[0.95rem] font-medium no-underline transition-colors ${
                    isActive
                      ? 'bg-sage-100 text-forest-700'
                      : 'text-ink-soft hover:bg-sage-50 hover:text-forest-700'
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <ButtonLink
              to={connected ? homeRouteFor(profile) : '/connexion'}
              className="ml-2 !min-h-10 !px-4"
            >
              {connected ? 'Mon espace' : 'Se connecter'}
            </ButtonLink>
          </nav>
          <button
            type="button"
            className="rounded-lg p-2 text-forest-700 hover:bg-sage-50 md:hidden"
            aria-expanded={open}
            aria-controls="menu-mobile"
            aria-label="Ouvrir le menu"
            onClick={() => setOpen((o) => !o)}
          >
            <IconMenu />
          </button>
        </div>
        {open && (
          <nav
            id="menu-mobile"
            className="border-t border-sand bg-cream-light px-4 py-3 md:hidden"
            aria-label="Navigation publique mobile"
          >
            <ul className="flex flex-col gap-1">
              {links.map((l) => (
                <li key={l.to}>
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-lg px-3 py-3 font-medium no-underline ${isActive ? 'bg-sage-100 text-forest-700' : 'text-ink-soft'}`
                    }
                  >
                    {l.label}
                  </NavLink>
                </li>
              ))}
              <li className="pt-2">
                <ButtonLink
                  to={connected ? homeRouteFor(profile) : '/connexion'}
                  className="w-full"
                >
                  {connected ? 'Mon espace' : 'Se connecter'}
                </ButtonLink>
              </li>
            </ul>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <Outlet />
      </main>

      <footer className="border-t border-sand/70 bg-cream-light">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Le Cocon — La Parenthèse des Invisibles. Un espace privé, sans pression commerciale.
          </p>
          <ul className="flex flex-wrap gap-4">
            <li>
              <Link to="/charte" className="hover:text-forest-700">
                Charte
              </Link>
            </li>
            <li>
              <Link to="/confidentialite" className="hover:text-forest-700">
                Confidentialité
              </Link>
            </li>
            <li>
              <Link to="/connexion" className="hover:text-forest-700">
                Connexion
              </Link>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  )
}
