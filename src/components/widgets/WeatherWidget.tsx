import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog, Wind, Droplets, Thermometer } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useWeather, type WeatherCondition } from '../../contexts/HomeAssistantContext'

interface WeatherWidgetProps {
  entityId: string
  entrance?: boolean
  entranceDelay?: number
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
    icon: Sun,
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

export function WeatherWidget({
  entityId,
  entrance = false,
  entranceDelay = 0,
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
            className="w-16 h-16 rounded-xl bg-surface-hover/50 flex items-center justify-center"
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
