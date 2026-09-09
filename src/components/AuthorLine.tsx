import { Link } from 'react-router-dom'
import { Avatar } from './ui'

/** Signature d'un contenu : initiales, nom, et repère de temps. */
export function AuthorLine({
  name,
  memberId,
  meta,
  size = 'sm',
}: {
  name: string
  memberId?: string
  meta?: string
  size?: 'sm' | 'md'
}) {
  const [first = '', ...rest] = name.split(' ')
  const inner = (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar firstName={first || '?'} lastName={rest.join(' ')} size={size} />
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{name}</span>
        {meta && <span className="block text-sm text-ink-muted">{meta}</span>}
      </span>
    </span>
  )

  if (!memberId) return inner
  return (
    <Link to={`/app/talents/${memberId}`} className="min-w-0 no-underline hover:opacity-80">
      {inner}
    </Link>
  )
}
