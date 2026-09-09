import type { ReactNode } from 'react'
import { Button, Card } from './ui'

/**
 * État vide accueillant : on explique en une phrase, et on propose d'inaugurer
 * l'espace. Aucun faux contenu n'est affiché pour « meubler ».
 */
export function EmptySpace({
  icon,
  title,
  children,
  actionLabel,
  onAction,
}: {
  icon: string
  title: string
  children: ReactNode
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <Card className="flex flex-col items-center py-10 text-center">
      <div className="mb-3 text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-xl">{title}</h2>
      <div className="mt-2 max-w-md text-ink-soft">{children}</div>
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Card>
  )
}
