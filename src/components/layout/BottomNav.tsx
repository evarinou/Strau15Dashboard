import { NavLink } from 'react-router-dom'
import { Home, Music, ClipboardList, DoorOpen } from 'lucide-react'
import { clsx } from 'clsx'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/music', icon: Music, label: 'Musik' },
  { to: '/tasks', icon: ClipboardList, label: 'Aufgaben' },
  { to: '/rooms', icon: DoorOpen, label: 'Räume' },
]

export function BottomNav() {
  return (
    // pb-[env(safe-area-inset-bottom)] statt der früheren Klasse
    // safe-area-inset-bottom, die nirgends definiert war und deshalb
    // auf Geräten mit Home-Indikator kein Padding erzeugte.
    <nav className="glass-panel glass-l3 lg:hidden fixed bottom-0 inset-x-0 z-40 rounded-none border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center gap-1 rounded-2xl w-16 h-[52px] transition-all',
                isActive ? 'glass-l3 text-accent shadow-pill' : 'text-text-secondary'
              )
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
