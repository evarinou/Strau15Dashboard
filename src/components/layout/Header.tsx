import { useState } from 'react'
import { Home, Settings, ChevronDown, Check, Wifi, WifiOff } from 'lucide-react'
import { clsx } from 'clsx'
import { useCurrentUser } from '../../contexts/UserContext'
import { useHA } from '../../contexts/HomeAssistantContext'

export function Header() {
  const { currentUser, users, setCurrentUser } = useCurrentUser()
  const { connectionState } = useHA()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Home className="w-5 h-5 text-accent" />
          <span className="font-semibold text-lg">Strau15</span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div
            className={clsx(
              'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
              connectionState === 'connected'
                ? 'bg-success/20 text-success'
                : 'bg-danger/20 text-danger'
            )}
          >
            {connectionState === 'connected' ? (
              <Wifi className="w-3 h-3" />
            ) : (
              <WifiOff className="w-3 h-3" />
            )}
            <span className="hidden sm:inline">
              {connectionState === 'connected' ? 'Verbunden' : 'Offline'}
            </span>
          </div>

          {/* User selector */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated hover:bg-surface-hover transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium">
                {currentUser?.display_name?.[0] || currentUser?.username[0] || '?'}
              </div>
              <span className="hidden sm:inline text-sm">
                {currentUser?.display_name || currentUser?.username}
              </span>
              <ChevronDown className="w-4 h-4 text-text-secondary" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 w-48 py-1 bg-surface-elevated rounded-lg border border-border shadow-xl">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setCurrentUser(user)
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-hover transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-white text-xs font-medium">
                        {user.display_name?.[0] || user.username[0]}
                      </div>
                      <span className="flex-1 text-sm">
                        {user.display_name || user.username}
                      </span>
                      {currentUser?.id === user.id && (
                        <Check className="w-4 h-4 text-accent" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Settings */}
          <button className="p-2 rounded-lg hover:bg-surface-hover transition-colors">
            <Settings className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  )
}
