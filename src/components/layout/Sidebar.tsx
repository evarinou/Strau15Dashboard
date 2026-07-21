import {
  Home,
  Music,
  Clapperboard,
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
  Tv,
  Popcorn,
  ExternalLink,
} from 'lucide-react'
import { useRooms } from '../../hooks/useChoreQuest'
import { useLinks } from '../../hooks/useBff'
import { NavPill } from '../ui/NavPill'

const mainNavItems = [
  { to: '/', icon: Home, label: 'Übersicht' },
  { to: '/music', icon: Music, label: 'Musik' },
  { to: '/medien', icon: Clapperboard, label: 'Medien' },
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
    { href: links?.jellyfin, icon: Tv, label: 'Jellyfin' },
    { href: links?.seerr, icon: Popcorn, label: 'Seerr' },
  ].filter((service): service is { href: string; icon: typeof Home; label: string } =>
    Boolean(service.href)
  )

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border">
      {/* Wortmarke: der einzige Ort mit dem Sonnenpunkt der Tagphase */}
      <div className="flex items-center gap-2.5 px-6 pt-7 pb-6">
        <span className="daylight-dot w-7 h-7" aria-hidden="true" />
        <span className="font-display font-extrabold text-xl tracking-tight text-ink">
          Strau15
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="space-y-1">
          {mainNavItems.map(({ to, icon, label }) => (
            <NavPill key={to} to={to} icon={icon} label={label} end={to === '/'} />
          ))}
        </div>

        <div className="mt-7">
          <h3 className="px-4 mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em]">
            Räume
          </h3>
          <div className="space-y-0.5">
            {rooms
              .filter((room) => room.ha_area_id !== 'wecker')
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((room) => (
                <NavPill
                  key={room.id}
                  to={`/room/${room.ha_area_id || room.id}`}
                  icon={roomIcons[room.ha_area_id || ''] || DoorOpen}
                  label={room.name}
                  dense
                />
              ))}
          </div>
        </div>

        {/* Externe Dienste — öffnen in neuem Tab */}
        {services.length > 0 && (
          <div className="mt-7">
            <h3 className="px-4 mb-2 text-[11px] font-semibold text-text-muted uppercase tracking-[0.12em]">
              Dienste
            </h3>
            <div className="space-y-0.5">
              {services.map(({ href, icon: Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 px-3 py-2 rounded-full text-text-secondary hover:bg-white/35 hover:text-ink transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm flex-1 truncate">{label}</span>
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
