import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { AuthContext } from '../hooks/useAuth'
import { RequireAuth, RequireZone } from './RouteGuard'
import type { MemberRole, MemberStatus, Profile } from '../lib/database.types'

const profile = (role: MemberRole, status: MemberStatus): Profile => ({
  id: 'u1',
  role,
  status,
  first_name: 'Test',
  last_name: '',
  is_hidden: false,
  visible_to_accompanied: false,
  public_directory_consent: false,
  onboarding_done: false,
  invited_by: null,
  created_at: '',
  updated_at: '',
  headline: '',
  activity: '',
  approach: '',
  skills: [],
  contribution_topics: [],
  audience: '',
  location: '',
  presence: 'les-deux',
  current_project: '',
  website: '',
  instagram: '',
})

const noop = async () => {
  throw new Error('non utilisé')
}

function renderAt(path: string, p: Profile | null) {
  const router = createMemoryRouter(
    [
      { path: '/connexion', element: <p>Page de connexion</p> },
      {
        element: <RequireAuth />,
        children: [
          {
            element: <RequireZone zone="candidate" />,
            children: [{ path: '/app/candidature', element: <p>Espace candidat</p> }],
          },
          {
            element: <RequireZone zone="blocked" />,
            children: [{ path: '/app/acces-restreint', element: <p>Accès restreint</p> }],
          },
          {
            element: <RequireZone zone="cocon" />,
            children: [
              { path: '/app', element: <p>Accueil du Cocon</p> },
              {
                element: <RequireZone zone="professional" />,
                children: [{ path: '/app/fil', element: <p>Fil du Cocon</p> }],
              },
              {
                element: <RequireZone zone="founder" />,
                children: [{ path: '/app/gouvernance', element: <p>Gouvernance</p> }],
              },
            ],
          },
        ],
      },
    ],
    { initialEntries: [path] },
  )
  const session = p ? ({ user: { id: 'u1' } } as never) : null
  render(
    <AuthContext.Provider
      value={{
        loading: false,
        error: null,
        session,
        profile: p,
        signInWithEmail: noop,
        signOut: noop,
        refreshProfile: noop,
        updateProfile: noop,
        retry: () => {},
      }}
    >
      <RouterProvider router={router} />
    </AuthContext.Provider>,
  )
  return router
}

describe('Gardes de routes — saisie directe d’une URL protégée', () => {
  it('scénario 1/22 : un visiteur est renvoyé vers la connexion avec la destination mémorisée', () => {
    const r = renderAt('/app/gouvernance', null)
    expect(screen.getByText('Page de connexion')).toBeInTheDocument()
    expect(r.state.location.search).toContain('next=%2Fapp%2Fgouvernance')
  })
  it('scénario 3 : un candidat en attente n’entre pas dans le Cocon', () => {
    const r = renderAt('/app', profile('candidate', 'pending'))
    expect(r.state.location.pathname).toBe('/app/candidature')
    expect(screen.getByText('Espace candidat')).toBeInTheDocument()
  })
  it('scénario 3 bis : un candidat ne peut pas ouvrir le Fil par son URL', () => {
    const r = renderAt('/app/fil', profile('candidate', 'pending'))
    expect(r.state.location.pathname).toBe('/app/candidature')
  })
  it('une candidature refusée arrive sur la page d’accès restreint', () => {
    const r = renderAt('/app', profile('candidate', 'refused'))
    expect(r.state.location.pathname).toBe('/app/acces-restreint')
  })
  it('un compte suspendu arrive sur la page d’accès restreint', () => {
    const r = renderAt('/app/fil', profile('professional', 'suspended'))
    expect(r.state.location.pathname).toBe('/app/acces-restreint')
  })
  it('scénario 7 : un professionnel validé accède au Fil', () => {
    renderAt('/app/fil', profile('professional', 'active'))
    expect(screen.getByText('Fil du Cocon')).toBeInTheDocument()
  })
  it('un professionnel en pause garde son accès', () => {
    renderAt('/app', profile('professional', 'paused'))
    expect(screen.getByText('Accueil du Cocon')).toBeInTheDocument()
  })
  it('un professionnel ne peut pas ouvrir la gouvernance', () => {
    const r = renderAt('/app/gouvernance', profile('professional', 'active'))
    expect(r.state.location.pathname).toBe('/app')
    expect(screen.getByText('Accueil du Cocon')).toBeInTheDocument()
  })
  it('scénario 8 : une personne accompagnée entre mais ne voit pas le Fil professionnel', () => {
    const r = renderAt('/app/fil', profile('accompanied', 'active'))
    expect(r.state.location.pathname).toBe('/app')
  })
  it('une fondatrice accède à la gouvernance', () => {
    renderAt('/app/gouvernance', profile('founder', 'active'))
    expect(screen.getByText('Gouvernance')).toBeInTheDocument()
  })
  it('un membre actif qui tape l’URL candidat est renvoyé à l’accueil', () => {
    const r = renderAt('/app/candidature', profile('professional', 'active'))
    expect(r.state.location.pathname).toBe('/app')
  })
})
