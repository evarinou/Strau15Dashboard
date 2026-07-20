import { NavLink } from 'react-router-dom'
import {
  Home,
  Music,
  ClipboardList,
  DoorOpen,
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  BookOpen,
  Hammer,
  Sun,
  Printer,
  HousePlug,
  Images,
  FileText,
  ListTodo,
  ExternalLink,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useRooms } from '../../hooks/useChoreQuest'
import { useLinks } from '../../hooks/useBff'

const mainNavItems = [
  { to: '/', icon: Home, label: 'Übersicht' },
  { to: '/music', icon: Music, label: 'Musik' },
  { to: '/tasks', icon: ClipboardList, label: 'Aufgaben' },
]

const roomIcons: Record<string, typeof Home> = {
  wohnzimmer: Sofa,
  kuche: UtensilsCrossed,
  schlafzimmer: Bed,
  bad: Bath,
  bucherzimmer: BookOpen,
  werkstatt: Hammer,
  innenhof: Sun,
  '3d_drucker_zimmer': Printer,
}

export function Sidebar() {
  const { data: rooms = [] } = useRooms()
  const { data: links } = useLinks()

  // Externe Hausdienste — nur anzeigen, was auch konfiguriert ist
  const services = [
    { href: links?.homeAssistant, icon: HousePlug, label: 'Home Assistant' },
    { href: links?.immich, icon: Images, label: 'Fotos' },
    { href: links?.paperless, icon: FileText, label: 'Dokumente' },
    { href: links?.vikunja, icon: ListTodo, label: 'Vikunja' },
  ].filter((service): service is { href: string; icon: typeof Home; label: string } =>
    Boolean(service.href)
  )

  return (
    <aside className="hidden lg:flex flex-col w-56 h-screen fixed left-0 top-0 z-40 bg-surface border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-2 h-14 px-4 border-b border-border">
        <Home className="w-5 h-5 text-accent" />
        <span className="font-semibold text-lg">Strau15</span>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {mainNavItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                )
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Rooms */}
        <div className="mt-6">
          <h3 className="px-3 mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
            Räume
          </h3>
          <div className="space-y-1">
            {rooms
              .filter((room) => room.ha_area_id !== 'wecker')
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((room) => {
                const Icon = roomIcons[room.ha_area_id || ''] || DoorOpen
                return (
                  <NavLink
                    key={room.id}
                    to={`/room/${room.ha_area_id || room.id}`}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                        isActive
                          ? 'bg-accent/10 text-accent'
                          : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                      )
                    }
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{room.name}</span>
                  </NavLink>
                )
              })}
          </div>
        </div>

        {/* Externe Dienste — öffnen in neuem Tab */}
        {services.length > 0 && (
          <div className="mt-6">
            <h3 className="px-3 mb-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
              Dienste
            </h3>
            <div className="space-y-1">
              {services.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm flex-1">{label}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}
