import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Lightbulb, LightbulbOff, Moon, Check } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { TaskWidget, LeaderboardWidget, ScriptWidget, SceneWidget, WeatherHero, WasteCollectionWidget, AlarmWidget } from '../components/widgets'
import { useTodayInstances } from '../hooks/useChoreQuest'
import { useHA, useWeather } from '../contexts/HomeAssistantContext'
import { useCurrentUser } from '../contexts/UserContext'
import type { CompletionResponse } from '../types/chorequest'
import type { User } from '../types/chorequest'
import { SCRIPTS, SCENES, WEATHER_ENTITY, WASTE_CALENDAR } from '../config/entities'

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

// Generate weather particles
function useWeatherParticles(count: number) {
  return useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 0.8 + Math.random() * 0.6,
      size: 0.3 + Math.random() * 0.4,
    })),
    [count]
  )
}

// Weather effect component for hero background
function HeroWeatherEffect({ condition }: { condition: string }) {
  const rainParticles = useWeatherParticles(20)
  const snowParticles = useWeatherParticles(15)

  switch (condition) {
    case 'sunny':
      return (
        <div className="absolute top-2 right-8 w-24 h-24 animate-sun-rotate pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute left-1/2 top-1/2 w-1 h-10 bg-gradient-to-b from-yellow-400/40 to-transparent rounded-full animate-sun-rays"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-50%)`,
                transformOrigin: 'center bottom',
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
          <div
            className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/20"
            style={{ boxShadow: '0 0 40px oklch(0.85 0.2 85 / 0.4)' }}
          />
        </div>
      )

    case 'rainy':
    case 'pouring':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {rainParticles.map((p) => (
            <div
              key={p.id}
              className="absolute w-0.5 rounded-full bg-gradient-to-b from-cyan-400/50 to-cyan-400/10 animate-rain"
              style={{
                left: `${p.left}%`,
                height: `${12 + p.size * 10}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
              }}
            />
          ))}
        </div>
      )

    case 'snowy':
    case 'snowy-rainy':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {snowParticles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-full bg-white/60 animate-snow"
              style={{
                left: `${p.left}%`,
                width: `${4 + p.size * 5}px`,
                height: `${4 + p.size * 5}px`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${2.5 + p.duration}s`,
                boxShadow: '0 0 6px oklch(0.95 0.02 250 / 0.4)',
              }}
            />
          ))}
        </div>
      )

    case 'lightning':
    case 'lightning-rainy':
      return (
        <>
          <div
            className="absolute inset-0 bg-yellow-100/0 animate-lightning pointer-events-none rounded-2xl"
            style={{ animationDelay: `${Math.random() * 2}s` }}
          />
          {condition === 'lightning-rainy' && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {rainParticles.map((p) => (
                <div
                  key={p.id}
                  className="absolute w-0.5 rounded-full bg-gradient-to-b from-cyan-400/50 to-cyan-400/10 animate-rain"
                  style={{
                    left: `${p.left}%`,
                    height: `${12 + p.size * 10}px`,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`,
                  }}
                />
              ))}
            </div>
          )}
        </>
      )

    case 'cloudy':
    case 'partlycloudy':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-4 left-8 w-16 h-8 bg-gray-400/15 rounded-full animate-cloud-drift blur-sm"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute top-8 right-16 w-12 h-6 bg-gray-400/10 rounded-full animate-cloud-drift blur-sm"
            style={{ animationDelay: '3s' }}
          />
        </div>
      )

    case 'fog':
      return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl">
          <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-gray-400/15 to-transparent animate-fog-wave" />
          <div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-400/10 to-transparent animate-fog-wave"
            style={{ animationDelay: '2s' }}
          />
        </div>
      )

    default:
      return null
  }
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
        'relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300',
        'border touch-target haptic-feedback',
        isSelected
          ? 'bg-accent/15 border-accent/50 border-glow-accent'
          : 'bg-surface-elevated/50 border-border/30 hover:bg-surface-hover hover:border-border/50'
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'relative w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
          isSelected
            ? 'bg-accent text-white'
            : 'bg-surface-hover text-text-secondary'
        )}
        style={{
          boxShadow: isSelected
            ? '0 0 12px oklch(0.623 0.214 259.13 / 0.5)'
            : 'none',
        }}
      >
        {initials}
        {/* Check mark overlay */}
        {isSelected && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-success flex items-center justify-center"
            style={{
              boxShadow: '0 0 6px oklch(0.627 0.194 149.21 / 0.5)',
            }}
          >
            <Check className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      {/* Name - hidden on mobile */}
      <div className="text-left hidden sm:block">
        <p
          className={clsx(
            'text-sm font-medium transition-all duration-300',
            isSelected && 'text-accent text-glow-accent'
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
  const weather = useWeather(WEATHER_ENTITY)

  // Count active lights
  const activeLights = Array.from(entities.values()).filter(
    (e) => e.entity_id.startsWith('light.') && e.state === 'on'
  ).length

  const animatedLightCount = useAnimatedCounter(activeLights, 800)

  // Filter pending tasks
  const pendingTasks = todayInstances.filter((t) => t.status === 'pending').slice(0, 4)

  return (
    <div className="space-y-4">
      {celebration && (
        <CelebrationOverlay response={celebration} onClose={() => setCelebration(null)} />
      )}

      {/* Hero Section with Weather Effect */}
      <div className="animate-entrance">
        <div
          className="relative rounded-2xl overflow-hidden p-4 sm:p-5 glass border border-border/30"
          style={{
            background: 'linear-gradient(135deg, oklch(0.205 0.015 285.82 / 0.8) 0%, oklch(0.145 0.014 285.82 / 0.9) 100%)',
          }}
        >
          {/* Weather animation effect */}
          <HeroWeatherEffect condition={weather.condition} />

          {/* Gradient accent in corner */}
          <div
            className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at top right, oklch(0.623 0.214 259.13 / 0.1) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left: Weather + Greeting */}
            <div className="flex items-center gap-4">
              {/* Weather Hero */}
              <WeatherHero entityId={WEATHER_ENTITY} />

              {/* Greeting */}
              <div>
                <h1 className="text-lg sm:text-xl font-bold">
                  Hallo, {currentUser?.display_name?.split(' ')[0] || currentUser?.username || 'Gast'}!
                </h1>
                <p className="text-text-secondary text-sm">
                  {new Date().toLocaleDateString('de-DE', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>

            {/* Right: User Switcher */}
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
      </div>

      {/* Quick Actions */}
      <section className="animate-entrance animate-entrance-delay-1">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <ScriptWidget
            entityId={SCRIPTS.alleHauptlichterEin}
            icon={<Lightbulb className="w-5 h-5" />}
          />
          <ScriptWidget
            entityId={SCRIPTS.alleHauptlichterAus}
            icon={<LightbulbOff className="w-5 h-5" />}
          />
          <SceneWidget entityId={SCENES.fernsehabend} />
          <ScriptWidget
            entityId={SCRIPTS.guteNachtRoutine}
            icon={<Moon className="w-5 h-5" />}
          />
        </div>
      </section>

      {/* Main grid - optimized for no-scroll */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Tasks column */}
        <div className="lg:col-span-2">
          <Card className="animate-entrance animate-entrance-delay-2">
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
                </span>
              )}
            </CardHeader>

            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 bg-surface-hover rounded-lg animate-shimmer"
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-6 text-text-secondary">
                <div
                  className="text-4xl mb-2 animate-float"
                  style={{
                    filter: 'drop-shadow(0 0 10px oklch(0.627 0.194 149.21 / 0.5))',
                  }}
                >
                  ✨
                </div>
                <p className="text-glow-success text-sm">Alle Aufgaben erledigt!</p>
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
        </div>

        {/* Sidebar - compact widgets in 2x2 grid */}
        <div className="space-y-3">
          {/* Row 1: Lights + Leaderboard */}
          <div className="grid grid-cols-2 gap-3">
            {/* Light status - mini */}
            <Card entrance entranceDelay={3} className="!p-3">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
                    activeLights > 0 ? 'bg-warning/20' : 'bg-surface-hover'
                  )}
                  style={{
                    boxShadow: activeLights > 0
                      ? '0 0 15px oklch(0.769 0.188 70.08 / 0.3)'
                      : 'none',
                  }}
                >
                  <Lightbulb
                    className={clsx(
                      'w-5 h-5 transition-all duration-300',
                      activeLights > 0 ? 'text-warning icon-glow-warning' : 'text-text-secondary'
                    )}
                  />
                </div>
                <div>
                  <p
                    className={clsx(
                      'text-lg font-bold tabular-nums transition-all duration-300',
                      activeLights > 0 ? 'text-warning text-glow-warning' : 'text-text-primary'
                    )}
                  >
                    {animatedLightCount}
                  </p>
                  <p className="text-xs text-text-secondary">Lichter an</p>
                </div>
              </div>
            </Card>

            {/* Leaderboard - compact */}
            <LeaderboardWidget entrance entranceDelay={4} compact />
          </div>

          {/* Row 2: Waste + Alarm */}
          <div className="grid grid-cols-2 gap-3">
            {/* Waste Collection - mini */}
            <WasteCollectionWidget
              entityId={WASTE_CALENDAR}
              entrance
              entranceDelay={5}
              variant="mini"
            />

            {/* Alarm - mini (links to bedroom for full settings) */}
            <Link to="/room/schlafzimmer" className="block">
              <AlarmWidget
                variant="mini"
                entrance
                entranceDelay={6}
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
