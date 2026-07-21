import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, LightbulbOff, Moon, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { TaskWidget, LeaderboardWidget, ScriptWidget, SceneWidget, WeatherHero, AlarmWidget, BriefingCard, PhotosCard, CalendarCard, VikunjaCard, DocumentsCard } from '../components/widgets'
import { useTodayInstances } from '../hooks/useChoreQuest'
import { useHA } from '../contexts/HomeAssistantContext'
import { useCurrentUser } from '../contexts/UserContext'
import type { CompletionResponse } from '../types/chorequest'
import type { User } from '../types/chorequest'
import { SCRIPTS, SCENES, WEATHER_ENTITY } from '../config/entities'

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
    // Konfetti in den Farben des Hauses statt Tailwind-Standardtönen
    color: ['#FF9EBB', '#C9A7F5', '#FFB98A', '#8FD9C0', '#9FB8F0', '#F7C8E0'][
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
          'glass-panel glass-l4 glass-blur-lg r-panel relative p-8 max-w-sm mx-4 text-center',
          'animate-scale-bounce',
          hasAchievement && 'ring-2 ring-warning/50'
        )}
      >
        {/* Success icon */}
        <div className="glass-inset w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center">
          <span className="text-5xl">{hasAchievement ? '🏆' : '🎉'}</span>
        </div>

        <h2 className="font-display text-xl font-extrabold mb-2 text-ink">
          {hasAchievement ? 'Achievement freigeschaltet!' : 'Aufgabe erledigt!'}
        </h2>

        {/* Points display */}
        <div className="mb-4">
          <span className="font-display text-4xl font-extrabold text-accent animate-count-pulse inline-block">
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
                className="glass-inset flex items-center justify-center gap-3 p-3"
              >
                <span className="text-3xl">{achievement.icon || '🏆'}</span>
                <div className="text-left">
                  <p className="font-medium text-warning">
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

// User avatar button component - more compact version
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
        'relative flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300',
        'touch-target haptic-feedback',
        isSelected
          ? 'glass-l3 ring-1 ring-accent/40 shadow-pill'
          : 'hover:bg-white/40'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
          isSelected ? 'bg-accent text-on-fill' : 'bg-white/50 text-text-secondary'
        )}
      >
        {initials}
        {/* Check mark overlay */}
        {isSelected && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      {/* Name - hidden on mobile */}
      <div className="text-left hidden sm:block">
        <p
          className={clsx(
            'text-sm font-medium transition-all duration-300',
            isSelected ? 'text-accent' : 'text-text-secondary'
          )}
        >
          {user.display_name?.split(' ')[0] || user.username}
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
  const pendingTasks = todayInstances.filter((t) => t.status === 'pending').slice(0, 4)

  const today = useMemo(
    () =>
      new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }),
    []
  )

  return (
    <div className="space-y-4">
      {celebration && (
        <CelebrationOverlay response={celebration} onClose={() => setCelebration(null)} />
      )}

      {/* Kopfzeile: Seitentitel links, Wetter und Benutzerwahl rechts */}
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-extrabold tracking-[-0.03em] text-ink text-4xl lg:text-5xl">
            Übersicht
          </h1>
          <p className="text-sm text-text-secondary mt-1 capitalize">{today}</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <WeatherHero entityId={WEATHER_ENTITY} />
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
      </header>

      {/*
        Haupt-Grid nach dem Vorbild: links der breite Arbeitsbereich,
        rechts eine durchgehend hohe Spalte, die vom Briefing angeführt
        wird. Mobil fällt alles in eine Spalte zusammen.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <PhotosCard />

          {/* ChoreQuest: heutige Aufgaben */}
          <Card className="animate-entrance animate-entrance-delay-2">
            <CardHeader>
              <CardTitle>Heutige Aufgaben</CardTitle>
              {pendingTasks.length > 0 && (
                <span className="text-xs bg-accent/12 text-accent px-2.5 py-0.5 rounded-full font-medium">
                  {pendingTasks.length} offen
                </span>
              )}
            </CardHeader>

            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-white/35 rounded-2xl animate-shimmer"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2 animate-float">✨</div>
                <p className="text-success text-sm font-medium">Alle Aufgaben erledigt!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((instance, index) => (
                  <TaskWidget
                    key={instance.id}
                    instance={instance}
                    onComplete={setCelebration}
                    entrance
                    entranceDelay={index + 1}
                    compact
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Haus-Zeile: Schnellzugriff, Lichter-Zähler, Wecker */}
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Schnellzugriff
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ScriptWidget
                variant="tile"
                label="Licht an"
                entityId={SCRIPTS.alleHauptlichterEin}
                icon={<Lightbulb className="w-4 h-4" />}
              />
              <ScriptWidget
                variant="tile"
                label="Licht aus"
                entityId={SCRIPTS.alleHauptlichterAus}
                icon={<LightbulbOff className="w-4 h-4" />}
              />
              <SceneWidget variant="tile" label="Fernsehabend" entityId={SCENES.fernsehabend} />
              <ScriptWidget
                variant="tile"
                label="Gute Nacht"
                entityId={SCRIPTS.guteNachtRoutine}
                icon={<Moon className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
              {/* Lichter-Zähler */}
              <Card className="!p-3">
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-2xl flex items-center justify-center transition-colors',
                      activeLights > 0 ? 'bg-warning/15' : 'glass-inset'
                    )}
                  >
                    <Lightbulb
                      className={clsx(
                        'w-5 h-5',
                        activeLights > 0 ? 'text-warning' : 'text-text-secondary'
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-display text-lg font-extrabold tabular-nums text-ink">
                      {animatedLightCount}
                    </p>
                    <p className="text-xs text-text-secondary">Lichter an</p>
                  </div>
                </div>
              </Card>

              {/* Wecker — verlinkt aufs Schlafzimmer für alle Einstellungen */}
              <Link to="/room/schlafzimmer" className="block">
                <AlarmWidget variant="mini" />
              </Link>
            </div>
          </section>
        </div>

        {/* Rechte Spalte: Briefing führt, darunter Termine und Stand */}
        <div className="space-y-4">
          <BriefingCard
            name={currentUser?.display_name?.split(' ')[0] || currentUser?.username}
          />
          <CalendarCard />
          <VikunjaCard />
          <LeaderboardWidget />
          <DocumentsCard />
        </div>
      </div>
    </div>
  )
}
