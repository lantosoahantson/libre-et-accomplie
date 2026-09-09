import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'

/* ----------------------------------------------------------------------------
   Composants de base du design system.
   ---------------------------------------------------------------------------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-forest-500 text-cream-light hover:bg-forest-600 active:bg-forest-700 disabled:bg-sage-300 shadow-sm',
  secondary:
    'bg-sage-100 text-forest-700 hover:bg-sage-200 active:bg-sage-300 border border-sage-200 disabled:opacity-60',
  ghost: 'bg-transparent text-forest-600 hover:bg-sage-50 active:bg-sage-100 disabled:opacity-60',
  danger:
    'bg-danger-100 text-danger-600 hover:bg-danger-100/80 border border-danger-600/20 disabled:opacity-60',
}

const baseButton =
  'inline-flex items-center justify-center gap-2 rounded-xl px-5 font-semibold transition-colors ' +
  'min-h-12 cursor-pointer disabled:cursor-not-allowed select-none text-base'

export function Button({
  variant = 'primary',
  className = '',
  loading = false,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean }) {
  return (
    <button
      type={props.type ?? 'button'}
      className={`${baseButton} ${variantClasses[variant]} ${className}`}
      disabled={props.disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'primary',
  className = '',
  children,
  external = false,
}: {
  to: string
  variant?: Variant
  className?: string
  children: ReactNode
  external?: boolean
}) {
  const cls = `${baseButton} ${variantClasses[variant]} no-underline ${className}`
  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className={cls}>
        {children}
      </a>
    )
  }
  return (
    <Link to={to} className={cls}>
      {children}
    </Link>
  )
}

export function Spinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const px =
    size === 'sm'
      ? 'h-4 w-4 border-2'
      : size === 'lg'
        ? 'h-10 w-10 border-[3px]'
        : 'h-6 w-6 border-2'
  return (
    <span role="status" className="inline-flex items-center gap-3">
      <span
        className={`${px} inline-block animate-spin rounded-full border-current border-t-transparent opacity-70`}
        aria-hidden="true"
      />
      {label ? (
        <span className="text-ink-soft">{label}</span>
      ) : (
        <span className="sr-only">Chargement…</span>
      )}
    </span>
  )
}

export function Card({
  children,
  className = '',
  as: Tag = 'section',
}: {
  children: ReactNode
  className?: string
  as?: 'section' | 'div' | 'article' | 'li'
}) {
  return <Tag className={`card ${className}`}>{children}</Tag>
}

type AlertTone = 'info' | 'success' | 'error' | 'warning'
const alertClasses: Record<AlertTone, string> = {
  info: 'bg-sage-50 border-sage-200 text-forest-700',
  success: 'bg-success-100 border-sage-200 text-success-700',
  error: 'bg-danger-100 border-danger-600/30 text-danger-600',
  warning: 'bg-ochre-100 border-ochre-300 text-ochre-500',
}

export function Alert({
  tone = 'info',
  title,
  children,
  className = '',
}: {
  tone?: AlertTone
  title?: string
  children?: ReactNode
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border px-4 py-3 ${alertClasses[tone]} ${className}`}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children && (
        <div className={title ? 'mt-1 text-[0.95rem]' : 'text-[0.95rem]'}>{children}</div>
      )}
    </div>
  )
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
  optional,
}: {
  id: string
  label: string
  hint?: string
  error?: string
  children: ReactNode
  optional?: boolean
}) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-muted">(facultatif)</span>}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm font-medium text-danger-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function Input({
  className = '',
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`input ${className}`}
      aria-invalid={error || undefined}
      aria-describedby={props.id ? (error ? `${props.id}-error` : `${props.id}-hint`) : undefined}
      {...props}
    />
  )
}

/** Compteur de caractères : la limite est toujours annoncée, jamais appliquée en silence. */
export function CharCount({ value, max }: { value: string; max: number }) {
  const len = value.length
  const over = len > max
  return (
    <span
      className={`text-sm tabular-nums ${over ? 'font-semibold text-danger-600' : 'text-ink-muted'}`}
      aria-live="polite"
    >
      {len} / {max} caractères{over ? ' — trop long' : ''}
    </span>
  )
}

export function PageHeader({
  eyebrow,
  title,
  intro,
  actions,
}: {
  eyebrow?: string
  title: string
  intro?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-sage-500">
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {intro && <p className="mt-2 max-w-2xl text-ink-soft">{intro}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  )
}

export function EmptyState({
  icon,
  title,
  children,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
}) {
  return (
    <div className="card flex flex-col items-center py-10 text-center">
      {icon && (
        <div className="mb-3 text-4xl text-sage-400" aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 className="text-xl">{title}</h2>
      {children && <div className="mt-2 max-w-md text-ink-soft">{children}</div>}
    </div>
  )
}

export function Logo({
  size = 'md',
  withText = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
}) {
  const px = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-14 w-14' : 'h-10 w-10'
  return (
    <span className="inline-flex items-center gap-3">
      <svg viewBox="0 0 64 64" className={`${px} shrink-0`} aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#3f6b4f" />
        <path d="M32 12c-9 6-15 14-15 22a15 15 0 0 0 30 0c0-8-6-16-15-22z" fill="#f6f1e7" />
        <path d="M32 20c-5 4-9 9-9 14a9 9 0 0 0 18 0c0-5-4-10-9-14z" fill="#9db89c" />
      </svg>
      {withText && (
        <span className="flex flex-col leading-tight">
          <span className="font-serif text-lg text-forest-700">Le Cocon</span>
          {size !== 'sm' && (
            <span className="text-xs text-ink-muted">La Parenthèse des Invisibles</span>
          )}
        </span>
      )}
    </span>
  )
}

export function Badge({
  children,
  tone = 'sage',
}: {
  children: ReactNode
  tone?: 'sage' | 'ochre' | 'blush' | 'neutral'
}) {
  const cls = {
    sage: 'bg-sage-100 text-forest-700',
    ochre: 'bg-ochre-100 text-ochre-500',
    blush: 'bg-blush-100 text-blush-400',
    neutral: 'bg-sand text-ink-soft',
  }[tone]
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${cls}`}>
      {children}
    </span>
  )
}

export function Textarea({
  className = '',
  error,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean }) {
  return (
    <textarea
      className={`input min-h-28 resize-y leading-relaxed ${className}`}
      aria-invalid={error || undefined}
      aria-describedby={props.id ? (error ? `${props.id}-error` : `${props.id}-hint`) : undefined}
      {...props}
    />
  )
}

export function Select({
  className = '',
  error,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={`input cursor-pointer pr-10 ${className}`}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
    </select>
  )
}

/** Pastille d'initiales : le prototype n'impose aucune photo. */
export function Avatar({
  firstName,
  lastName,
  size = 'md',
}: {
  firstName: string
  lastName?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const initials = `${firstName.trim()[0] ?? '?'}${(lastName ?? '').trim()[0] ?? ''}`.toUpperCase()
  const cls =
    size === 'sm' ? 'h-9 w-9 text-sm' : size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-12 w-12 text-base'
  return (
    <span
      aria-hidden="true"
      className={`${cls} inline-flex shrink-0 items-center justify-center rounded-full bg-sage-200 font-serif font-medium text-forest-700`}
    >
      {initials}
    </span>
  )
}

/** Filtres en pastilles, utilisables au clavier et confortables au doigt. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; count?: number }[]
  value: T
  onChange: (value: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="-mx-1 flex flex-wrap gap-2 px-1">
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`min-h-10 rounded-full border px-4 text-[0.95rem] font-medium transition-colors ${
              active
                ? 'border-forest-500 bg-forest-500 text-cream-light'
                : 'border-sand-dark bg-cream-light text-ink-soft hover:border-sage-300 hover:text-forest-700'
            }`}
          >
            {o.label}
            {typeof o.count === 'number' && (
              <span className={active ? 'ml-1.5 opacity-80' : 'ml-1.5 text-ink-muted'}>
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Champ de recherche simple, avec effacement. */
export function SearchField({
  id,
  value,
  onChange,
  placeholder,
  label,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        className="input pl-11"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4.5 4.5" strokeLinecap="round" />
      </svg>
    </div>
  )
}

/** Liste de mots-clés, compétences ou sujets. */
export function TagList({
  items,
  tone = 'sage',
}: {
  items: string[]
  tone?: 'sage' | 'ochre' | 'neutral'
}) {
  if (items.length === 0) return null
  const cls = {
    sage: 'bg-sage-100 text-forest-700',
    ochre: 'bg-ochre-100 text-ochre-500',
    neutral: 'bg-sand text-ink-soft',
  }[tone]
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className={`rounded-full px-3 py-0.5 text-sm ${cls}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

/** Lien externe, cliquable et reconnaissable, qui s'ouvre dans un nouvel onglet. */
export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-9 items-center gap-1.5 break-all text-forest-600 underline decoration-sage-300 underline-offset-4 hover:text-forest-700 hover:decoration-forest-500"
    >
      {children}
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path d="M14 4h6v6M20 4l-8 8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  )
}
