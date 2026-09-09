import { useState, type KeyboardEvent } from 'react'
import { Button, Input } from './ui'

/**
 * Saisie d'une liste de mots : compétences, sujets de contribution.
 * Chaque entrée est ajoutée explicitement et peut être retirée d'un clic.
 */
export function TagEditor({
  id,
  items,
  onChange,
  max,
  placeholder,
  maxLength = 40,
}: {
  id: string
  items: string[]
  onChange: (items: string[]) => void
  max: number
  placeholder: string
  maxLength?: number
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const add = () => {
    const value = draft.trim()
    if (!value) return
    if (value.length > maxLength) {
      setError(
        `Chaque entrée fait ${maxLength} caractères au plus. Celle-ci en compte ${value.length}.`,
      )
      return
    }
    if (items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      setError('Cette entrée figure déjà dans la liste.')
      return
    }
    if (items.length >= max) {
      setError(`Vous pouvez indiquer ${max} entrées au maximum.`)
      return
    }
    onChange([...items, value])
    setDraft('')
    setError(null)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          error={Boolean(error)}
          onChange={(e) => {
            setDraft(e.target.value)
            if (error) setError(null)
          }}
          onKeyDown={onKeyDown}
        />
        <Button variant="secondary" onClick={add} disabled={!draft.trim()}>
          Ajouter
        </Button>
      </div>

      {error && (
        <p className="mt-1.5 text-sm font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}

      {items.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-center gap-1 rounded-full bg-sage-100 py-1 pl-3 pr-1 text-forest-700"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onChange(items.filter((i) => i !== item))}
                aria-label={`Retirer ${item}`}
                className="flex h-7 w-7 items-center justify-center rounded-full text-forest-600 hover:bg-sage-200"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  aria-hidden="true"
                >
                  <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-1.5 text-sm text-ink-muted">
        {items.length} / {max}
      </p>
    </div>
  )
}
