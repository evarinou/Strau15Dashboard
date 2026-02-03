import { useState, useEffect, useMemo } from 'react'
import { Lightbulb, LightbulbOff, Moon, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { TaskWidget, LeaderboardWidget, ScriptWidget, SceneWidget, VacuumWidget, WeatherWidget, WasteCollectionWidget, AlarmWidget } from '../components/widgets'
import { useTodayInstances } from '../hooks/useChoreQuest'
import { useHA } from '../contexts/HomeAssistantContext'
import { useCurrentUser } from '../contexts/UserContext'
import type { CompletionResponse } from '../types/chorequest'
import type { User } from '../types/chorequest'

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }

    const startTime = Date.now()
    const startValue = count

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (target - startValue) * eased)

      setCount(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration])

  return count
}

// Generate confetti particles
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.3,
    duration: 1.5 + Math.random() * 1.5,
    color: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'][
      Math.floor(Math.random() * 6)
    ],
    size: 6 + Math.random() * 6,
    rotation: Math.random() * 360,
  }))
}

// Enhanced Celebration overlay for completed tasks
function CelebrationOverlay({
  response,
  onClose,
}: {
  response: CompletionResponse
  onClose: () => void
}) {
  const confettiParticles = useMemo(() => generateConfetti(20), [])
  const hasAchievement = response.unlocked_achievements.length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Confetti */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {confettiParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-sm"
            style={{
              left: `${particle.left}%`,
              top: '-20px',
              width: particle.size,
              height: particle.size * 0.6,
              backgroundColor: particle.color,
              transform: `rotate(${particle.rotation}deg)`,
              animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className={clsx(
          'relative bg-surface-elevated rounded-2xl p-8 max-w-sm mx-4 text-center',
          'animate-scale-bounce glass-heavy',
          hasAchievement && 'border border-warning/50 border-glow-on'
        )}
        style={{
          boxShadow: hasAchievement
            ? '0 0 40px oklch(0.769 0.188 70.08 / 0.3)'
            : '0 0 30px oklch(0.627 0.194 149.21 / 0.3)',
        }}
      >
        {/* Success icon */}
        <div
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/20 flex items-center justify-center animate-glow-burst"
          style={{
            boxShadow: '0 0 30px oklch(0.627 0.194 149.21 / 0.5)',
          }}
        >
          <span className="text-5xl">
            {hasAchievement ? '🏆' : '🎉'}
          </span>
        </div>

        <h2 className="text-xl font-bold mb-2 text-glow-success">
          {hasAchievement ? 'Achievement freigeschaltet!' : 'Aufgabe erledigt!'}
        </h2>

        {/* Points display */}
        <div className="mb-4">
          <span
            className="text-4xl font-bold text-accent animate-count-pulse inline-block"
            style={{
              textShadow: '0 0 20px oklch(0.623 0.214 259.13 / 0.5)',
            }}
          >
            +{response.bonus_breakdown.total_points}
          </span>
          <span className="text-text-secondary ml-2">Punkte</span>
        </div>

        {response.bonus_breakdown.bonus_points > 0 && (
          <div className="text-sm text-text-secondary mb-4 space-y-1">
            <p className="text-text-secondary/70">
              Basis: {response.bonus_breakdown.base_points}
            </p>
            <p className="text-success font-medium">
              + {response.bonus_breakdown.bonus_points} Bonus
            </p>
          </div>
        )}

        {/* Achievement display */}
        {hasAchievement && (
          <div className="mt-4 pt-4 border-t border-border/50">
            {response.unlocked_achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-center justify-center gap-3 p-3 rounded-lg bg-warning/10"
                style={{
                  boxShadow: '0 0 15px oklch(0.769 0.188 70.08 / 0.2)',
                }}
              >
                <span className="text-3xl">{achievement.icon || '🏆'}</span>
                <div className="text-left">
                  <p className="font-medium text-warning text-glow-warning">
                    {achievement.name}
                  </p>
                  {achievement.description && (
                    <p className="text-xs text-text-secondary">{achievement.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// User avatar button component
function UserAvatar({
  user,
  isSelected,
  onClick,
}: {
  user: User
  isSelected: boolean
  onClick: () => void
}) {
  const initials = user.display_name
    ? user.display_name.split(' ').map((n) => n[0]).join('').slice(0, 2)
    : user.username.slice(0, 2).toUpperCase()

  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300',
        'border',
        isSelected
          ? 'bg-accent/15 border-accent/50 border-glow-accent'
          : 'bg-surface-elevated/50 border-border/30 hover:bg-surface-hover hover:border-border/50'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
          isSelected
            ? 'bg-accent text-white'
            : 'bg-surface-hover text-text-secondary'
        )}
        style={{
          boxShadow: isSelected
            ? '0 0 15px oklch(0.623 0.214 259.13 / 0.5)'
            : 'none',
        }}
      >
        {initials}
        {/* Check mark overlay */}
        {isSelected && (
          <div
            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center"
            style={{
              boxShadow: '0 0 8px oklch(0.627 0.194 149.21 / 0.5)',
            }}
          >
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      {/* Name */}
      <div className="text-left">
        <p
          className={clsx(
            'text-sm font-medium transition-all duration-300',
            isSelected && 'text-accent text-glow-accent'
          )}
        >
          {user.display_name || user.username}
        </p>
        <p className="text-xs text-text-secondary">
          {isSelected ? 'Aktiv' : 'Wechseln'}
        </p>
      </div>
    </button>
  )
}

export function Dashboard() {
  const { entities } = useHA()
  const { currentUser, users, setCurrentUser } = useCurrentUser()
  const { data: todayInstances = [], isLoading: tasksLoading } = useTodayInstances()
  const [celebration, setCelebration] = useState<CompletionResponse | null>(null)

  // Count active lights
  const activeLights = Array.from(entities.values()).filter(
    (e) => e.entity_id.startsWith('light.') && e.state === 'on'
  ).length

  const animatedLightCount = useAnimatedCounter(activeLights, 800)

  // Filter pending tasks
  const pendingTasks = todayInstances.filter((t) => t.status === 'pending').slice(0, 5)

  return (
    <div className="space-y-6">
      {celebration && (
        <CelebrationOverlay response={celebration} onClose={() => setCelebration(null)} />
      )}

      {/* Welcome with User Switcher */}
      <div className="animate-entrance">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              Hallo, {currentUser?.display_name || currentUser?.username || 'Gast'}!
            </h1>
            <p className="text-text-secondary">
              {new Date().toLocaleDateString('de-DE', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          {/* User Switcher */}
          <div className="flex gap-2">
            {users.map((user) => (
              <UserAvatar
                key={user.id}
                user={user}
                isSelected={currentUser?.id === user.id}
                onClick={() => setCurrentUser(user)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions - staggered entrance */}
      <section className="animate-entrance animate-entrance-delay-1">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span
            className="w-1 h-5 bg-accent rounded-full"
            style={{ boxShadow: '0 0 8px oklch(0.623 0.214 259.13 / 0.5)' }}
          />
          Schnellzugriff
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <ScriptWidget
            entityId="script.alle_hauptlichter_ein"
            icon={<Lightbulb className="w-5 h-5" />}
          />
          <ScriptWidget
            entityId="script.alle_hauptlichter_aus"
            icon={<LightbulbOff className="w-5 h-5" />}
          />
          <SceneWidget entityId="scene.fernsehabend" />
          <ScriptWidget
            entityId="script.gute_nacht_routine"
            icon={<Moon className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tasks column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks */}
          <section className="animate-entrance animate-entrance-delay-2">
            <Card>
              <CardHeader>
                <CardTitle glow>Heutige Aufgaben</CardTitle>
                {pendingTasks.length > 0 && (
                  <span
                    className="relative text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full"
                    style={{
                      boxShadow: '0 0 10px oklch(0.623 0.214 259.13 / 0.3)',
                    }}
                  >
                    {pendingTasks.length} offen
                    <span className="absolute inset-0 rounded-full animate-glow-pulse opacity-50" />
                  </span>
                )}
              </CardHeader>

              {tasksLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-surface-hover rounded-lg animate-shimmer"
                      style={{ animationDelay: `${i * 100}ms` }}
                    />
                  ))}
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-text-secondary">
                  <div
                    className="text-5xl mb-3 animate-float"
                    style={{
                      filter: 'drop-shadow(0 0 10px oklch(0.627 0.194 149.21 / 0.5))',
                    }}
                  >
                    ✨
                  </div>
                  <p className="text-glow-success">Alle Aufgaben erledigt!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((instance, index) => (
                    <TaskWidget
                      key={instance.id}
                      instance={instance}
                      onComplete={setCelebration}
                      entrance
                      entranceDelay={index + 1}
                    />
                  ))}
                </div>
              )}
            </Card>
          </section>

          {/* Vacuum */}
          <section className="animate-entrance animate-entrance-delay-4">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span
                className="w-1 h-5 bg-accent rounded-full"
                style={{ boxShadow: '0 0 8px oklch(0.623 0.214 259.13 / 0.5)' }}
              />
              Staubsauger
            </h2>
            <VacuumWidget entityId="vacuum.roborock_s7" entrance entranceDelay={5} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Weather */}
          <WeatherWidget
            entityId="weather.forecast_home"
            entrance
            entranceDelay={3}
          />

          {/* Waste Collection */}
          <WasteCollectionWidget
            entityId="calendar.landkreis_kronach"
            entrance
            entranceDelay={4}
          />

          {/* Alarm/Wecker */}
          <AlarmWidget
            variant="compact"
            entrance
            entranceDelay={5}
          />

          {/* Light status */}
          <Card entrance entranceDelay={6}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" glow>
                <Lightbulb
                  className={clsx(
                    'w-4 h-4 transition-all duration-300',
                    activeLights > 0 && 'text-warning icon-glow-warning'
                  )}
                />
                Lichter
              </CardTitle>
            </CardHeader>
            <div className="text-center py-4">
              <p
                className={clsx(
                  'text-5xl font-bold tabular-nums transition-all duration-300',
                  activeLights > 0 ? 'text-warning text-glow-warning' : 'text-accent'
                )}
              >
                {animatedLightCount}
              </p>
              <p className="text-sm text-text-secondary mt-1">
                {activeLights === 1 ? 'Licht eingeschaltet' : 'Lichter eingeschaltet'}
              </p>
              {/* Glow indicator bar */}
              <div className="mt-4 h-1 bg-surface-hover rounded-full overflow-hidden">
                <div
                  className="h-full bg-warning rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min((activeLights / 10) * 100, 100)}%`,
                    boxShadow:
                      activeLights > 0
                        ? '0 0 10px oklch(0.769 0.188 70.08 / 0.6)'
                        : 'none',
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Leaderboard */}
          <LeaderboardWidget entrance entranceDelay={7} />
        </div>
      </div>
    </div>
  )
}
