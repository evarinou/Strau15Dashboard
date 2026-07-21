import { type ComponentType } from 'react'
import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'

export interface NavPillProps {
  to: string
  icon: ComponentType<{ className?: string }>
  label: string
  end?: boolean
  /** Kleinere Variante für die Raumliste unterhalb der Hauptnavigation. */
  dense?: boolean
}

export function NavPill({ to, icon: Icon, label, end = false, dense = false }: NavPillProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 rounded-full transition-all duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          dense ? 'px-3 py-2' : 'px-3.5 py-2.5',
          isActive
            ? 'glass-l3 text-ink font-semibold shadow-pill'
            : 'text-text-secondary hover:bg-white/35 hover:text-ink'
        )
      }
    >
      <Icon className={dense ? 'w-4 h-4' : 'w-5 h-5'} />
      <span className={clsx('truncate', dense ? 'text-sm' : 'text-sm font-medium')}>{label}</span>
    </NavLink>
  )
}
