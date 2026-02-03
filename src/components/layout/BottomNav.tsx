import { NavLink } from 'react-router-dom'
import { Home, Lightbulb, Music, ClipboardList, DoorOpen } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/lights', icon: Lightbulb, label: 'Lichter' },
  { to: '/music', icon: Music, label: 'Musik' },
  { to: '/tasks', icon: ClipboardList, label: 'Aufgaben' },
  { to: '/rooms', icon: DoorOpen, label: 'Räume' },
]

export function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/80 backdrop-blur-lg border-t border-border safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors',
                isActive ? 'text-accent' : 'text-text-secondary hover:text-text-primary'
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
