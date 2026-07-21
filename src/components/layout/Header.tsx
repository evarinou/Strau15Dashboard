import { useState } from 'react'
import { ChevronDown, Check, Wifi, WifiOff } from 'lucide-react'
import { clsx } from 'clsx'
import { useCurrentUser } from '../../contexts/UserContext'
import { useHA } from '../../contexts/HomeAssistantContext'

export function Header() {
  const { currentUser, users, setCurrentUser } = useCurrentUser()
  const { connectionState } = useHA()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const connected = connectionState === 'connected'

  return (
    <header className="glass-panel glass-l3 sticky top-0 z-40 rounded-none border-x-0 border-t-0">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Wortmarke mit dem Tagphasen-Punkt wie in der Sidebar */}
        <div className="flex items-center gap-2.5">
          <span className="daylight-dot w-6 h-6" aria-hidden="true" />
          <span className="font-display font-extrabold text-lg tracking-tight text-ink">
            Strau15
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Verbindungsstatus */}
          <div
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
              connected ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
            )}
          >
            {connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden sm:inline">{connected ? 'Verbunden' : 'Offline'}</span>
          </div>

          {/* Benutzerwahl */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="glass-inset flex items-center gap-2 px-2.5 py-1.5 rounded-full hover:bg-white/90 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-on-fill text-xs font-bold">
                {currentUser?.display_name?.[0] || currentUser?.username[0] || '?'}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-ink">
                {currentUser?.display_name || currentUser?.username}
              </span>
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                <div className="glass-panel glass-l4 glass-blur-lg absolute right-0 top-full mt-2 z-20 w-48 py-1.5 rounded-2xl">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user)
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/40 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-on-fill text-xs font-bold">
                        {user.display_name?.[0] || user.username[0]}
                      </div>
                      <span className="flex-1 text-sm text-ink">
                        {user.display_name || user.username}
                      </span>
                      {currentUser?.id === user.id && <Check className="w-4 h-4 text-accent" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
