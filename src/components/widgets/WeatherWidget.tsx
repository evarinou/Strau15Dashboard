import { useMemo } from 'react'
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets, Thermometer, Moon } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useWeather, type WeatherCondition } from '../../contexts/HomeAssistantContext'

interface WeatherWidgetProps {
  entityId: string
  entrance?: boolean
  entranceDelay?: number
  showAnimations?: boolean
}

// Map weather conditions to icons and colors
const WEATHER_CONFIG: Record<
  WeatherCondition,
  { icon: typeof Sun; color: string; glowColor: string; bgGlow: string }
> = {
  sunny: {
    icon: Sun,
    color: 'text-yellow-400',
    glowColor: 'icon-glow-warning',
    bgGlow: 'oklch(0.769 0.188 70.08 / 0.15)',
  },
  'clear-night': {
    icon: Moon,
    color: 'text-indigo-300',
    glowColor: '',
    bgGlow: 'oklch(0.5 0.15 280 / 0.1)',
  },
  cloudy: {
    icon: Cloud,
    color: 'text-gray-400',
    glowColor: '',
    bgGlow: 'oklch(0.5 0.02 285 / 0.1)',
  },
  partlycloudy: {
    icon: Cloud,
    color: 'text-gray-300',
    glowColor: '',
    bgGlow: 'oklch(0.6 0.02 285 / 0.1)',
  },
  rainy: {
    icon: CloudRain,
    color: 'text-cyan-400',
    glowColor: 'icon-glow-cyan',
    bgGlow: 'oklch(0.6 0.15 200 / 0.15)',
  },
  pouring: {
    icon: CloudRain,
    color: 'text-blue-400',
    glowColor: 'icon-glow-accent',
    bgGlow: 'oklch(0.623 0.214 259.13 / 0.15)',
  },
  snowy: {
    icon: CloudSnow,
    color: 'text-blue-200',
    glowColor: '',
    bgGlow: 'oklch(0.9 0.05 250 / 0.1)',
  },
  'snowy-rainy': {
    icon: CloudSnow,
    color: 'text-blue-300',
    glowColor: '',
    bgGlow: 'oklch(0.7 0.1 250 / 0.1)',
  },
  hail: {
    icon: CloudSnow,
    color: 'text-cyan-300',
    glowColor: 'icon-glow-cyan',
    bgGlow: 'oklch(0.7 0.15 200 / 0.15)',
  },
  lightning: {
    icon: CloudLightning,
    color: 'text-yellow-300',
    glowColor: 'icon-glow-warning',
    bgGlow: 'oklch(0.769 0.188 70.08 / 0.2)',
  },
  'lightning-rainy': {
    icon: CloudLightning,
    color: 'text-yellow-400',
    glowColor: 'icon-glow-warning',
    bgGlow: 'oklch(0.769 0.188 70.08 / 0.2)',
  },
  fog: {
    icon: CloudFog,
    color: 'text-gray-400',
    glowColor: '',
    bgGlow: 'oklch(0.5 0.02 285 / 0.1)',
  },
  windy: {
    icon: Wind,
    color: 'text-teal-400',
    glowColor: '',
    bgGlow: 'oklch(0.6 0.1 180 / 0.1)',
  },
  'windy-variant': {
    icon: Wind,
    color: 'text-teal-300',
    glowColor: '',
    bgGlow: 'oklch(0.6 0.1 180 / 0.1)',
  },
  exceptional: {
    icon: Cloud,
    color: 'text-purple-400',
    glowColor: '',
    bgGlow: 'oklch(0.6 0.15 300 / 0.1)',
  },
  unknown: {
    icon: Cloud,
    color: 'text-gray-500',
    glowColor: '',
    bgGlow: 'oklch(0.4 0.02 285 / 0.1)',
  },
}

// Generate random particles for animations
function useRandomParticles(count: number) {
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

// Animated sun rays component
function SunRays() {
  return (
    <div className="absolute top-4 right-4 w-16 h-16 animate-sun-rotate">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 w-0.5 h-6 bg-gradient-to-b from-yellow-400/60 to-transparent rounded-full animate-sun-rays"
          style={{
            transform: `rotate(${i * 45}deg) translateY(-50%)`,
            transformOrigin: 'center bottom',
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
      <div
        className="absolute left-1/2 top-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-yellow-400/30"
        style={{
          boxShadow: '0 0 20px oklch(0.85 0.2 85 / 0.5)',
        }}
      />
    </div>
  )
}

// Animated rain drops component
function RainDrops({ intensity = 'normal' }: { intensity?: 'normal' | 'heavy' }) {
  const count = intensity === 'heavy' ? 25 : 15
  const particles = useRandomParticles(count)

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-0.5 rounded-full bg-gradient-to-b from-cyan-400/60 to-cyan-400/20 animate-rain"
          style={{
            left: `${p.left}%`,
            height: `${10 + p.size * 8}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

// Animated snow flakes component
function SnowFlakes() {
  const particles = useRandomParticles(12)

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-white/70 animate-snow"
          style={{
            left: `${p.left}%`,
            width: `${3 + p.size * 4}px`,
            height: `${3 + p.size * 4}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${2 + p.duration}s`,
            boxShadow: '0 0 4px oklch(0.95 0.02 250 / 0.5)',
          }}
        />
      ))}
    </div>
  )
}

// Animated lightning flash component
function LightningFlash() {
  return (
    <div
      className="absolute inset-0 bg-yellow-100/0 animate-lightning pointer-events-none rounded-xl"
      style={{
        animationDelay: `${Math.random() * 2}s`,
      }}
    />
  )
}

// Animated clouds component
function DriftingClouds() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute top-2 left-4 w-12 h-6 bg-gray-400/20 rounded-full animate-cloud-drift blur-sm"
        style={{ animationDelay: '0s' }}
      />
      <div
        className="absolute top-6 right-6 w-8 h-4 bg-gray-400/15 rounded-full animate-cloud-drift blur-sm"
        style={{ animationDelay: '2s' }}
      />
    </div>
  )
}

// Animated fog component
function FogEffect() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-gray-400/20 to-transparent animate-fog-wave"
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-400/15 to-transparent animate-fog-wave"
        style={{ animationDelay: '2s' }}
      />
    </div>
  )
}

// Get animated effect for condition
function WeatherEffect({ condition }: { condition: WeatherCondition }) {
  switch (condition) {
    case 'sunny':
      return <SunRays />
    case 'rainy':
      return <RainDrops intensity="normal" />
    case 'pouring':
      return <RainDrops intensity="heavy" />
    case 'snowy':
    case 'snowy-rainy':
    case 'hail':
      return <SnowFlakes />
    case 'lightning':
    case 'lightning-rainy':
      return (
        <>
          <LightningFlash />
          {condition === 'lightning-rainy' && <RainDrops intensity="heavy" />}
        </>
      )
    case 'cloudy':
    case 'partlycloudy':
      return <DriftingClouds />
    case 'fog':
      return <FogEffect />
    default:
      return null
  }
}

export function WeatherWidget({
  entityId,
  entrance = false,
  entranceDelay = 0,
  showAnimations = true,
}: WeatherWidgetProps) {
  const weather = useWeather(entityId)
  const config = WEATHER_CONFIG[weather.condition]
  const WeatherIcon = config.icon

  if (!weather.isAvailable) {
    return (
      <Card entrance={entrance} entranceDelay={entranceDelay}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            Wetter
          </CardTitle>
        </CardHeader>
        <div className="text-center py-4 text-text-secondary">
          <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nicht verfügbar</p>
        </div>
      </Card>
    )
  }

  return (
    <Card
      entrance={entrance}
      entranceDelay={entranceDelay}
      className="overflow-hidden"
    >
      {/* Background glow effect */}
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${config.bgGlow}, transparent 70%)`,
        }}
      />

      {/* Animated weather effects */}
      {showAnimations && <WeatherEffect condition={weather.condition} />}

      <CardHeader className="relative z-10">
        <CardTitle className="flex items-center gap-2" glow>
          <Thermometer className="w-4 h-4" />
          Wetter
        </CardTitle>
      </CardHeader>

      <div className="relative z-10">
        {/* Main weather display */}
        <div className="flex items-center gap-4 mb-4">
          {/* Weather icon */}
          <div
            className={clsx(
              'w-16 h-16 rounded-xl bg-surface-hover/50 flex items-center justify-center',
              weather.condition === 'sunny' && 'animate-sun-rays'
            )}
            style={{
              boxShadow: config.glowColor ? `0 0 20px ${config.bgGlow}` : undefined,
            }}
          >
            <WeatherIcon
              className={clsx('w-10 h-10 transition-all duration-300', config.color, config.glowColor)}
            />
          </div>

          {/* Temperature and condition */}
          <div className="flex-1">
            <p
              className={clsx(
                'text-4xl font-bold tabular-nums transition-all duration-300',
                weather.temperature !== null && weather.temperature > 25
                  ? 'text-warning text-glow-warning'
                  : weather.temperature !== null && weather.temperature < 5
                    ? 'text-cyan-400'
                    : 'text-text-primary'
              )}
            >
              {weather.temperature !== null ? `${Math.round(weather.temperature)}°` : '--°'}
            </p>
            <p className="text-sm text-text-secondary">{weather.conditionLabel}</p>
          </div>
        </div>

        {/* Additional info */}
        <div className="flex items-center gap-4 text-sm text-text-secondary">
          {weather.humidity !== null && (
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="tabular-nums">{weather.humidity}%</span>
            </div>
          )}
          {weather.windSpeed !== null && (
            <div className="flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-teal-400" />
              <span className="tabular-nums">{Math.round(weather.windSpeed)} km/h</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// Compact version for dashboard hero
export function WeatherHero({ entityId }: { entityId: string }) {
  const weather = useWeather(entityId)
  const config = WEATHER_CONFIG[weather.condition]
  const WeatherIcon = config.icon

  if (!weather.isAvailable) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className={clsx(
          'relative w-14 h-14 rounded-xl flex items-center justify-center',
          weather.condition === 'sunny' && 'overflow-visible'
        )}
        style={{
          background: `radial-gradient(circle, ${config.bgGlow}, transparent)`,
        }}
      >
        {/* Mini sun rays for sunny weather */}
        {weather.condition === 'sunny' && (
          <div className="absolute inset-0 animate-sun-rotate">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute left-1/2 top-1/2 w-0.5 h-4 bg-gradient-to-b from-yellow-400/50 to-transparent rounded-full"
                style={{
                  transform: `rotate(${i * 60}deg) translateY(-100%)`,
                  transformOrigin: 'center bottom',
                }}
              />
            ))}
          </div>
        )}
        <WeatherIcon
          className={clsx('w-8 h-8 transition-all duration-300 relative z-10', config.color, config.glowColor)}
        />
      </div>
      <div>
        <p
          className={clsx(
            'text-3xl font-bold tabular-nums transition-all duration-300',
            weather.temperature !== null && weather.temperature > 25
              ? 'text-warning text-glow-warning'
              : weather.temperature !== null && weather.temperature < 5
                ? 'text-cyan-400'
                : 'text-text-primary'
          )}
        >
          {weather.temperature !== null ? `${Math.round(weather.temperature)}°` : '--°'}
        </p>
        <p className="text-xs text-text-secondary">{weather.conditionLabel}</p>
      </div>
    </div>
  )
}
