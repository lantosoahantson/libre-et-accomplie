import { describe, expect, it } from 'vitest'
import { searchMembers, type DirectoryMember } from './useDirectory'

const member = (over: Partial<DirectoryMember>): DirectoryMember => ({
  id: 'x',
  role: 'professional',
  firstName: 'Alix',
  lastName: 'Exemple',
  headline: '',
  activity: 'Sophrologue',
  approach: '',
  skills: ['Respiration'],
  contributionTopics: [],
  audience: '',
  location: 'Nantes',
  presence: 'les-deux',
  currentProject: '',
  website: null,
  instagram: null,
  socialLinks: [],
  hidden: false,
  ...over,
})

describe('Recherche dans le Cercle des Talents', () => {
  const members = [
    member({ id: '1' }),
    member({
      id: '2',
      firstName: 'Naïma',
      activity: 'Accompagnante en transition',
      location: 'Lyon',
      skills: ['Écriture'],
    }),
    member({
      id: '3',
      firstName: 'Marion',
      activity: 'Naturopathe',
      location: 'Toulouse',
      skills: ['Alimentation'],
    }),
  ]

  it('rend la liste entière sans recherche', () => {
    expect(searchMembers(members, '')).toHaveLength(3)
    expect(searchMembers(members, '   ')).toHaveLength(3)
  })

  it('trouve par prénom, activité, compétence ou ville', () => {
    expect(searchMembers(members, 'naïma').map((m) => m.id)).toEqual(['2'])
    expect(searchMembers(members, 'naturopathe').map((m) => m.id)).toEqual(['3'])
    expect(searchMembers(members, 'respiration').map((m) => m.id)).toEqual(['1'])
    expect(searchMembers(members, 'lyon').map((m) => m.id)).toEqual(['2'])
  })

  it('ignore la casse et combine plusieurs mots', () => {
    expect(searchMembers(members, 'MARION toulouse').map((m) => m.id)).toEqual(['3'])
    expect(searchMembers(members, 'marion lyon')).toHaveLength(0)
  })
})
