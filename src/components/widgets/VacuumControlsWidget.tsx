import { Play, Pause, Square, Home, MapPin, AlertTriangle } from 'lucide-react'
import { clsx } from 'clsx'
import { useState } from 'react'
import { Button } from '../ui/Button'
import type { VacuumStatus } from '../../contexts/HomeAssistantContext'

interface VacuumControlsWidgetProps {
  status: VacuumStatus
  onStart: () => void
  onPause: () => void
  onStop: () => void
  onReturnToBase: () => void
  onLocate: () => void
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm p-6 rounded-2xl bg-surface-elevated border border-border/50 shadow-float-lg animate-scale-bounce">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-warning/20">
            <AlertTriangle className="w-6 h-6 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <p className="text-sm text-text-secondary mb-4">{message}</p>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1">
                Abbrechen
              </Button>
              <Button variant="danger" size="sm" onClick={onConfirm} className="flex-1">
                Stoppen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function VacuumControlsWidget({
  status,
  onStart,
  onPause,
  onStop,
  onReturnToBase,
  onLocate,
}: VacuumControlsWidgetProps) {
  const [showStopConfirm, setShowStopConfirm] = useState(false)
  const [isLocating, setIsLocating] = useState(false)

  const isCleaning = status === 'cleaning'
  const isPaused = status === 'paused'
  const isReturning = status === 'returning'
  const isDocked = status === 'docked'
  const isActive = isCleaning || isPaused || isReturning

  const handleStop = () => {
    setShowStopConfirm(true)
  }

  const confirmStop = () => {
    onStop()
    setShowStopConfirm(false)
  }

  const handleLocate = () => {
    setIsLocating(true)
    onLocate()
    setTimeout(() => setIsLocating(false), 3000)
  }

  return (
    <>
      <div className="space-y-3">
        {/* Primary controls row */}
        <div className="grid grid-cols-3 gap-2">
          {/* Start button */}
          <button
            onClick={onStart}
            disabled={isCleaning}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300',
              isCleaning
                ? 'bg-surface-hover/50 text-text-secondary cursor-not-allowed opacity-50'
                : 'bg-success/10 hover:bg-success/20 text-success hover:shadow-glow-success'
            )}
          >
            <Play className="w-6 h-6" />
            <span className="text-xs font-medium">Start</span>
          </button>

          {/* Pause button */}
          <button
            onClick={onPause}
            disabled={!isCleaning}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300',
              !isCleaning
                ? 'bg-surface-hover/50 text-text-secondary cursor-not-allowed opacity-50'
                : 'bg-warning/10 hover:bg-warning/20 text-warning hover:border-glow-on'
            )}
          >
            <Pause className="w-6 h-6" />
            <span className="text-xs font-medium">Pause</span>
          </button>

          {/* Stop button */}
          <button
            onClick={handleStop}
            disabled={!isActive}
            className={clsx(
              'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300',
              !isActive
                ? 'bg-surface-hover/50 text-text-secondary cursor-not-allowed opacity-50'
                : 'bg-danger/10 hover:bg-danger/20 text-danger'
            )}
          >
            <Square className="w-6 h-6" />
            <span className="text-xs font-medium">Stop</span>
          </button>
        </div>

        {/* Secondary controls row */}
        <div className="grid grid-cols-2 gap-2">
          {/* Return to base */}
          <button
            onClick={onReturnToBase}
            disabled={isDocked}
            className={clsx(
              'flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300',
              isDocked
                ? 'bg-surface-hover/50 text-text-secondary cursor-not-allowed opacity-50'
                : isReturning
                  ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 animate-pulse'
                  : 'bg-surface-hover hover:bg-surface-hover/80 hover:text-neon-cyan'
            )}
          >
            <Home className={clsx('w-5 h-5', isReturning && 'animate-float')} />
            <span className="text-sm font-medium">
              {isReturning ? 'Kehrt zurück...' : 'Zur Basis'}
            </span>
          </button>

          {/* Locate */}
          <button
            onClick={handleLocate}
            className={clsx(
              'relative flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300',
              'bg-surface-hover hover:bg-surface-hover/80 hover:text-accent',
              isLocating && 'text-accent'
            )}
          >
            <MapPin className={clsx('w-5 h-5', isLocating && 'animate-bounce')} />
            <span className="text-sm font-medium">Finden</span>

            {/* Ping animation when locating */}
            {isLocating && (
              <>
                <span className="absolute inset-0 rounded-xl animate-locate-ping bg-accent/30" />
                <span className="absolute inset-0 rounded-xl animate-locate-ping bg-accent/20" style={{ animationDelay: '0.5s' }} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stop confirmation dialog */}
      <ConfirmDialog
        isOpen={showStopConfirm}
        title="Reinigung stoppen?"
        message="Der Staubsauger wird die aktuelle Reinigung abbrechen und zur Ladestation zurückkehren."
        onConfirm={confirmStop}
        onCancel={() => setShowStopConfirm(false)}
      />
    </>
  )
}
