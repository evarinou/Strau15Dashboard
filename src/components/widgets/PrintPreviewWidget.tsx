import { useState, useRef, useEffect } from 'react'
import {
  Lightbulb,
  LightbulbOff,
  Pause,
  Play,
  Square,
  Camera,
  CameraOff,
  Layers,
  Clock,
  Percent,
  RefreshCw,
  Gauge,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '../ui/Button'

interface PrintPreviewWidgetProps {
  // Camera
  cameraUrl?: string | null
  cameraAvailable?: boolean

  // Print status
  isPrinting: boolean
  isPaused: boolean
  progress: number | null
  currentLayer: number | null
  totalLayers: number | null
  remainingTime: number | null // seconds
  printSpeed: number | null // percentage

  // Lights
  chamberLightOn?: boolean
  onToggleChamberLight?: () => void

  // Controls
  onPause?: () => void
  onResume?: () => void
  onStop?: () => void

  // Speed
  speedMode?: 'silent' | 'standard' | 'sport' | 'ludicrous'
  onSpeedModeChange?: (mode: string) => void

  className?: string
}

function formatTime(seconds: number | null): string {
  if (seconds === null || seconds < 0) return '--:--'
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${mins}m`
  return `${mins}m`
}

const SPEED_MODES = [
  { id: 'silent', label: 'Leise', icon: '🔇' },
  { id: 'standard', label: 'Standard', icon: '⚡' },
  { id: 'sport', label: 'Sport', icon: '🚀' },
  { id: 'ludicrous', label: 'Ludicrous', icon: '💨' },
]

export function PrintPreviewWidget({
  cameraUrl,
  cameraAvailable = false,
  isPrinting,
  isPaused,
  progress,
  currentLayer,
  totalLayers,
  remainingTime,
  printSpeed,
  chamberLightOn,
  onToggleChamberLight,
  onPause,
  onResume,
  onStop,
  speedMode = 'standard',
  onSpeedModeChange,
  className,
}: PrintPreviewWidgetProps) {
  const [showCamera, setShowCamera] = useState(cameraAvailable)
  const [cameraError, setCameraError] = useState(false)
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Reset camera error when URL changes
  useEffect(() => {
    setCameraError(false)
  }, [cameraUrl])

  const canControl = isPrinting || isPaused
  const displayProgress = progress ?? 0

  return (
    <div className={clsx('rounded-xl overflow-hidden bg-surface-elevated/50', className)}>
      {/* Camera / Preview area */}
      <div className="relative aspect-video bg-black/50">
        {/* Camera feed */}
        {showCamera && cameraUrl && !cameraError ? (
          <img
            ref={imgRef}
            src={cameraUrl}
            alt="Printer camera"
            className="w-full h-full object-cover"
            onError={() => setCameraError(true)}
          />
        ) : (
          /* Placeholder with print visualization */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-surface-elevated to-surface">
            {cameraError ? (
              <CameraOff className="w-12 h-12 text-text-secondary mb-2" />
            ) : (
              <div className="relative">
                {/* Animated print bed visualization */}
                <div className="w-32 h-32 relative">
                  {/* Bed */}
                  <div className="absolute bottom-0 w-full h-2 bg-surface-hover rounded" />
                  {/* Grid pattern */}
                  <svg className="absolute inset-0" viewBox="0 0 100 100">
                    <defs>
                      <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect x="10" y="20" width="80" height="60" fill="url(#grid)" />
                  </svg>
                  {/* Print progress visualization */}
                  {isPrinting && (
                    <div
                      className="absolute bottom-2 left-[10%] w-[80%] bg-accent/30 rounded-sm transition-all duration-1000"
                      style={{
                        height: `${(displayProgress / 100) * 60}%`,
                        boxShadow: '0 0 20px oklch(0.623 0.214 259.13 / 0.3)',
                      }}
                    >
                      <div className="absolute inset-0 animate-shimmer rounded-sm" />
                    </div>
                  )}
                  {/* Nozzle */}
                  {isPrinting && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 transition-all duration-500"
                      style={{ bottom: `${(displayProgress / 100) * 60 + 10}%` }}
                    >
                      <div className="w-3 h-6 bg-gradient-to-b from-gray-600 to-gray-800 rounded-b-sm" />
                      <div className="w-1 h-2 bg-warning mx-auto -mt-0.5 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            )}
            <span className="text-sm text-text-secondary mt-2">
              {cameraError ? 'Kamera nicht verfügbar' : 'Vorschau'}
            </span>
          </div>
        )}

        {/* Overlay controls */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
          {/* Left: Camera toggle */}
          <button
            onClick={() => setShowCamera(!showCamera)}
            className={clsx(
              'p-2 rounded-lg transition-all',
              showCamera ? 'bg-accent/80 text-white' : 'bg-black/50 text-text-secondary'
            )}
          >
            {showCamera ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
          </button>

          {/* Right: Stats overlay */}
          <div className="flex items-center gap-2">
            {/* Speed indicator */}
            {printSpeed !== null && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/50 text-xs">
                <Gauge className="w-3 h-3 text-neon-cyan" />
                <span className="text-neon-cyan font-medium">{printSpeed}%</span>
              </div>
            )}

            {/* Temp indicator could go here */}
          </div>
        </div>

        {/* Bottom progress bar overlay */}
        <div className="absolute bottom-0 left-0 right-0">
          {/* Progress stats */}
          <div className="flex items-center justify-between px-3 py-2 bg-black/60 text-xs">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span className="text-text-primary font-medium">
                  {currentLayer ?? '--'}/{totalLayers ?? '--'}
                </span>
              </span>
              <span className="flex items-center gap-1 text-neon-cyan">
                <Clock className="w-3.5 h-3.5" />
                <span className="font-medium">{formatTime(remainingTime)}</span>
              </span>
            </div>
            <span className="flex items-center gap-1 text-accent font-bold">
              <Percent className="w-3.5 h-3.5" />
              {Math.round(displayProgress)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-surface-hover">
            <div
              className={clsx(
                'h-full transition-all duration-500',
                isPrinting ? 'print-progress-bar' : isPaused ? 'bg-warning' : 'bg-accent/50'
              )}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Control panel */}
      <div className="p-3 space-y-3">
        {/* Speed mode selector */}
        {onSpeedModeChange && (
          <div className="flex items-center gap-2 p-1 rounded-lg bg-surface-hover">
            {SPEED_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onSpeedModeChange(mode.id)}
                className={clsx(
                  'flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all',
                  speedMode === mode.id
                    ? 'bg-accent text-white shadow-glow-accent'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'
                )}
              >
                <span className="mr-1">{mode.icon}</span>
                {mode.label}
              </button>
            ))}
          </div>
        )}

        {/* Main controls */}
        <div className="flex items-center gap-2">
          {/* Chamber light */}
          {onToggleChamberLight && (
            <Button
              variant={chamberLightOn ? 'primary' : 'secondary'}
              size="sm"
              onClick={onToggleChamberLight}
              className={clsx(
                'flex-1',
                chamberLightOn && 'bg-warning hover:bg-warning/80'
              )}
            >
              {chamberLightOn ? (
                <Lightbulb className="w-4 h-4 mr-1.5 icon-glow-warning" />
              ) : (
                <LightbulbOff className="w-4 h-4 mr-1.5" />
              )}
              Licht
            </Button>
          )}

          {/* Pause/Resume */}
          {canControl && (
            <>
              {isPaused ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onResume}
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  Fortsetzen
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onPause}
                  className="flex-1 hover:border-warning/50 hover:text-warning"
                >
                  <Pause className="w-4 h-4 mr-1.5" />
                  Pause
                </Button>
              )}
            </>
          )}

          {/* Stop with confirmation */}
          {canControl && (
            showStopConfirm ? (
              <div className="flex gap-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onStop?.()
                    setShowStopConfirm(false)
                  }}
                  className="bg-danger hover:bg-danger/80"
                >
                  Bestätigen
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStopConfirm(false)}
                >
                  ✕
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStopConfirm(true)}
                className="hover:text-danger hover:bg-danger/10"
              >
                <Square className="w-4 h-4" />
              </Button>
            )
          )}

          {/* Idle state */}
          {!canControl && (
            <Button
              variant="secondary"
              size="sm"
              disabled
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Bereit
            </Button>
          )}
        </div>

        {/* Stop confirmation warning */}
        {showStopConfirm && (
          <p className="text-xs text-danger text-center animate-pulse">
            Druck wirklich abbrechen?
          </p>
        )}
      </div>
    </div>
  )
}
