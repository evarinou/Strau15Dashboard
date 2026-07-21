import { Layers, Clock, FileBox } from 'lucide-react'
import { clsx } from 'clsx'

interface PrintProgressWidgetProps {
  jobName?: string | null
  progress: number | null
  currentLayer?: number | null
  totalLayers?: number | null
  remainingTime?: number | null
  status: 'idle' | 'printing' | 'paused' | 'finished' | 'error' | 'unknown'
  className?: string
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${mins}m`
}

export function PrintProgressWidget({
  jobName,
  progress,
  currentLayer,
  totalLayers,
  remainingTime,
  status,
  className,
}: PrintProgressWidgetProps) {
  const displayProgress = progress ?? 0
  const isPrinting = status === 'printing'
  const isPaused = status === 'paused'
  const isFinished = status === 'finished'
  const isError = status === 'error'
  const isIdle = status === 'idle' || status === 'unknown'

  const getStatusColor = () => {
    if (isFinished) return 'success'
    if (isError) return 'danger'
    if (isPaused) return 'warning'
    if (isPrinting) return 'accent'
    return 'secondary'
  }

  const statusColor = getStatusColor()

  // If idle and no job, show minimal state
  if (isIdle && !jobName && progress === null) {
    return (
      <div className={clsx('p-4 rounded-xl bg-surface-elevated/50', className)}>
        <div className="flex items-center gap-3 text-text-secondary">
          <FileBox className="w-5 h-5" />
          <span className="text-sm">Kein aktiver Druck</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={clsx(
        'p-4 rounded-xl transition-all duration-300',
        isPrinting && '',
        isFinished && '',
        isError && 'bg-danger/5 border border-danger/30',
        !isPrinting && !isFinished && !isError && 'bg-surface-elevated/50',
        className
      )}
    >
      {/* Job name */}
      {jobName && (
        <div className="flex items-center gap-2 mb-3">
          <FileBox className={clsx(
            'w-4 h-4',
            isPrinting && 'text-accent',
            isFinished && 'text-success',
            isError && 'text-danger'
          )} />
          <span className={clsx(
            'text-sm font-medium truncate',
            isPrinting && ''
          )}>
            {jobName}
          </span>
        </div>
      )}

      {/* Progress bar */}
      <div className="relative h-3 bg-surface-hover rounded-full overflow-hidden">
        {/* Background track */}
        <div className="absolute inset-0 bg-surface-hover rounded-full" />

        {/* Progress fill */}
        <div
          className={clsx(
            'absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out',
            isPrinting && 'print-progress-bar',
            isFinished && 'bg-success',
            isError && 'bg-danger',
            isPaused && 'bg-warning',
            isIdle && 'bg-text-secondary/30'
          )}
          style={{
            width: `${displayProgress}%`,
            boxShadow: isPrinting
              ? '0 0 15px rgb(from var(--color-accent) r g b / 0.5)'
              : isFinished
                ? '0 0 15px rgb(from var(--color-success) r g b / 0.5)'
                : undefined,
          }}
        />

        {/* Shimmer effect while printing */}
        {isPrinting && (
          <div
            className="absolute inset-y-0 left-0 rounded-full animate-shimmer"
            style={{ width: `${displayProgress}%` }}
          />
        )}
      </div>

      {/* Progress text and stats */}
      <div className="flex items-center justify-between mt-2">
        {/* Percentage */}
        <span
          className={clsx(
            'text-lg font-bold tabular-nums',
            `text-${statusColor}`,
            isPrinting && ''
          )}
        >
          {Math.round(displayProgress)}%
        </span>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-text-secondary">
          {/* Layer info */}
          {currentLayer !== null && totalLayers !== null && (
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              <span className="tabular-nums">
                {currentLayer}/{totalLayers}
              </span>
            </div>
          )}

          {/* Remaining time */}
          {remainingTime != null && remainingTime > 0 && (
            <div className={clsx(
              'flex items-center gap-1',
              isPrinting && 'text-accent'
            )}>
              <Clock className={clsx('w-3.5 h-3.5', isPrinting && 'animate-pulse')} />
              <span className="tabular-nums">~{formatTime(remainingTime as number)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status badge for paused/finished/error */}
      {(isPaused || isFinished || isError) && (
        <div className={clsx(
          'mt-3 px-3 py-1.5 rounded-lg text-xs font-medium text-center',
          isPaused && 'bg-warning/20 text-warning',
          isFinished && 'bg-success/20 text-success',
          isError && 'bg-danger/20 text-danger'
        )}>
          {isPaused && 'Pausiert'}
          {isFinished && 'Abgeschlossen!'}
          {isError && 'Fehler'}
        </div>
      )}
    </div>
  )
}
