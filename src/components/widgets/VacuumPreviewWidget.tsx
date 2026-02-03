import { Play, Pause, Square, Home, MapPin, Clock, Maximize2 } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Button } from '../ui/Button'
import type { VacuumStatus } from '../../contexts/HomeAssistantContext'

interface VacuumPreviewWidgetProps {
  status: VacuumStatus
  mapImageUrl: string | null
  mapAvailable: boolean
  lastCleanArea: number | null
  lastCleanDuration: number | null
  battery: number | null
  onStart: () => void
  onPause: () => void
  onStop: () => void
  onReturnToBase: () => void
  onLocate: () => void
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}min`
}

function VacuumAnimation({ status }: { status: VacuumStatus }) {
  const isCleaning = status === 'cleaning'
  const isReturning = status === 'returning'
  const isActive = isCleaning || isReturning

  return (
    <div className="relative w-full aspect-square flex items-center justify-center">
      {/* Background floor pattern */}
      <div className="absolute inset-4 rounded-2xl bg-surface-elevated/30 overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(90deg, var(--color-border) 1px, transparent 1px),
              linear-gradient(var(--color-border) 1px, transparent 1px)
            `,
            backgroundSize: '20px 20px',
          }}
        />
      </div>

      {/* Clean trail (when cleaning) */}
      {isCleaning && (
        <div className="absolute inset-8 rounded-xl overflow-hidden">
          <div
            className="absolute inset-0 animate-vacuum-trail opacity-30"
            style={{
              background: 'radial-gradient(circle at center, oklch(0.623 0.214 259.13 / 0.4) 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      {/* Vacuum robot SVG */}
      <div
        className={clsx(
          'relative z-10 transition-all duration-500',
          isCleaning && 'animate-vacuum-sweep',
          isReturning && 'animate-float'
        )}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-32 h-32"
          style={{
            filter: isActive
              ? 'drop-shadow(0 0 20px oklch(0.623 0.214 259.13 / 0.5))'
              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
          }}
        >
          {/* Outer ring */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isCleaning ? 'oklch(0.623 0.214 259.13)' : isReturning ? 'oklch(0.85 0.18 195)' : 'oklch(0.371 0.017 285.82)'}
            strokeWidth="2"
            className={clsx(isActive && 'animate-pulse')}
          />

          {/* Body */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="oklch(0.205 0.015 285.82)"
            stroke="oklch(0.371 0.017 285.82)"
            strokeWidth="1"
          />

          {/* Top plate */}
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="oklch(0.269 0.015 285.82)"
          />

          {/* LiDAR dome */}
          <circle
            cx="50"
            cy="40"
            r="8"
            fill="oklch(0.145 0.014 285.82)"
            stroke="oklch(0.371 0.017 285.82)"
            strokeWidth="1"
          />

          {/* Status light */}
          <circle
            cx="50"
            cy="40"
            r="4"
            fill={isCleaning ? 'oklch(0.623 0.214 259.13)' : isReturning ? 'oklch(0.85 0.18 195)' : status === 'docked' ? 'oklch(0.627 0.194 149.21)' : 'oklch(0.708 0.014 285.82)'}
            className={clsx(isActive && 'animate-pulse')}
          />

          {/* Front indicator */}
          <path
            d="M 35 70 Q 50 80, 65 70"
            fill="none"
            stroke="oklch(0.623 0.214 259.13)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity={isCleaning ? 1 : 0.3}
          />

          {/* Side brushes */}
          {isCleaning && (
            <>
              <g className="animate-spin-slow origin-center" style={{ transformOrigin: '25px 65px' }}>
                <circle cx="25" cy="65" r="8" fill="oklch(0.623 0.214 259.13 / 0.3)" />
                <line x1="25" y1="57" x2="25" y2="73" stroke="oklch(0.623 0.214 259.13)" strokeWidth="1" />
                <line x1="17" y1="65" x2="33" y2="65" stroke="oklch(0.623 0.214 259.13)" strokeWidth="1" />
              </g>
              <g className="animate-spin-slow origin-center" style={{ transformOrigin: '75px 65px', animationDirection: 'reverse' }}>
                <circle cx="75" cy="65" r="8" fill="oklch(0.623 0.214 259.13 / 0.3)" />
                <line x1="75" y1="57" x2="75" y2="73" stroke="oklch(0.623 0.214 259.13)" strokeWidth="1" />
                <line x1="67" y1="65" x2="83" y2="65" stroke="oklch(0.623 0.214 259.13)" strokeWidth="1" />
              </g>
            </>
          )}
        </svg>
      </div>

      {/* Pulsing rings when active */}
      {isActive && (
        <>
          <div
            className="absolute inset-0 m-auto w-40 h-40 rounded-full animate-ping opacity-20"
            style={{
              background: `radial-gradient(circle, ${isCleaning ? 'oklch(0.623 0.214 259.13)' : 'oklch(0.85 0.18 195)'} 0%, transparent 70%)`,
              animationDuration: '2s',
            }}
          />
        </>
      )}

      {/* Dock indicator (when docked) */}
      {status === 'docked' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
          <Home className="w-5 h-5 text-success" />
          <span className="text-xs text-success font-medium">Ladestation</span>
        </div>
      )}
    </div>
  )
}

export function VacuumPreviewWidget({
  status,
  mapImageUrl,
  mapAvailable,
  lastCleanArea,
  lastCleanDuration,
  battery,
  onStart,
  onPause,
  onStop,
  onReturnToBase,
  onLocate,
}: VacuumPreviewWidgetProps) {
  const [showMap, setShowMap] = useState(false)
  const isCleaning = status === 'cleaning'
  const isPaused = status === 'paused'
  const isReturning = status === 'returning'
  const isDocked = status === 'docked'

  return (
    <div className="flex flex-col">
      {/* Preview area */}
      <div className="relative aspect-square bg-surface/50 rounded-t-xl overflow-hidden">
        {/* Map view toggle */}
        {mapAvailable && (
          <button
            onClick={() => setShowMap(!showMap)}
            className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-surface-elevated/80 hover:bg-surface-hover transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}

        {/* Map or Animation */}
        {showMap && mapImageUrl ? (
          <img
            src={mapImageUrl}
            alt="Vacuum Map"
            className="w-full h-full object-contain"
          />
        ) : (
          <VacuumAnimation status={status} />
        )}

        {/* Stats overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-surface via-surface/80 to-transparent">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {lastCleanArea !== null && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="font-medium">{lastCleanArea} m²</span>
                </div>
              )}
              {lastCleanDuration !== null && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-text-secondary" />
                  <span>{formatDuration(lastCleanDuration)}</span>
                </div>
              )}
            </div>
            {battery !== null && (
              <div
                className={clsx(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  battery > 50 ? 'bg-success/20 text-success' :
                  battery > 20 ? 'bg-warning/20 text-warning' :
                  'bg-danger/20 text-danger'
                )}
              >
                {battery}%
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-border/30">
        <div className="flex items-center gap-2">
          {/* Main action button */}
          {isCleaning ? (
            <Button
              variant="secondary"
              size="md"
              onClick={onPause}
              className="flex-1 hover:border-warning/50 hover:text-warning"
            >
              <Pause className="w-4 h-4 mr-2" />
              Pause
            </Button>
          ) : isPaused ? (
            <Button
              variant="primary"
              size="md"
              onClick={onStart}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Fortsetzen
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={onStart}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-2" />
              Start
            </Button>
          )}

          {/* Stop button (when active) */}
          {(isCleaning || isPaused) && (
            <Button
              variant="danger"
              size="md"
              onClick={onStop}
              title="Stoppen"
            >
              <Square className="w-4 h-4" />
            </Button>
          )}

          {/* Return to base (when not docked and not already returning) */}
          {!isDocked && !isReturning && (
            <Button
              variant="ghost"
              size="md"
              onClick={onReturnToBase}
              className="hover:text-success hover:bg-success/10"
              title="Zur Ladestation"
            >
              <Home className="w-4 h-4" />
            </Button>
          )}

          {/* Locate button */}
          <Button
            variant="ghost"
            size="md"
            onClick={onLocate}
            className="hover:text-accent hover:bg-accent/10 locate-button"
            title="Finden"
          >
            <MapPin className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
