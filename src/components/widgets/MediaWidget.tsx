import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { Slider } from '../ui/Slider'
import { useMediaPlayer } from '../../contexts/HomeAssistantContext'

interface MediaWidgetProps {
  entityId: string
  compact?: boolean
  entrance?: boolean
  entranceDelay?: number
}

// Equalizer bars component
function EqualizerBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={clsx(
            'w-1 bg-accent rounded-full transition-all',
            isPlaying ? 'animate-[eq-bar_0.5s_ease-in-out_infinite]' : 'h-1'
          )}
          style={{
            height: isPlaying ? undefined : '4px',
            animationDelay: isPlaying ? `${i * 0.1}s` : undefined,
            boxShadow: isPlaying
              ? '0 0 6px rgb(from var(--color-accent) r g b / 0.6)'
              : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function MediaWidget({
  entityId,
  compact = false,
  entrance = false,
  entranceDelay = 0,
}: MediaWidgetProps) {
  const {
    state,
    isPlaying,
    isIdle,
    isUnavailable,
    volume,
    isMuted,
    mediaTitle,
    mediaArtist,
    friendlyName,
    play,
    pause,
    setVolume,
  } = useMediaPlayer(entityId)

  if (isUnavailable) {
    return null
  }

  const volumePercent = Math.round((volume || 0) * 100)

  if (compact) {
    return (
      <Card
        variant="interactive"
        entrance={entrance}
        entranceDelay={entranceDelay}
        glowOnActive={isPlaying}
        glowColor="accent"
        onClick={() => (isPlaying ? pause() : play())}
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
              isPlaying ? 'bg-accent/15 text-accent' : 'bg-surface-hover text-text-secondary'
            )}
            style={{
              boxShadow: isPlaying
                ? '0 0 15px rgb(from var(--color-accent) r g b / 0.4)'
                : 'none',
            }}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
            {/* Breathing pulse when playing */}
            {isPlaying && (
              <div
                className="absolute inset-0 rounded-full animate-breathe"
                style={{
                  background: 'radial-gradient(circle, rgb(from var(--color-accent) r g b / 0.3) 0%, transparent 70%)',
                }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={clsx(
                'text-sm font-medium truncate transition-all duration-300',
                isPlaying && ''
              )}
            >
              {friendlyName}
            </p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-text-secondary truncate flex-1">
                {isPlaying && mediaTitle ? mediaTitle : isIdle ? 'Idle' : state}
              </p>
              {isPlaying && <EqualizerBars isPlaying={isPlaying} />}
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card entrance={entrance} entranceDelay={entranceDelay} glowOnActive={isPlaying} glowColor="accent">
      <div className="flex flex-col gap-3">
        {/* Now playing info */}
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'relative w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300',
              isPlaying ? 'bg-accent/15' : 'bg-surface-hover'
            )}
            style={{
              boxShadow: isPlaying
                ? '0 0 20px rgb(from var(--color-accent) r g b / 0.3)'
                : 'none',
            }}
          >
            {isPlaying ? (
              <EqualizerBars isPlaying={isPlaying} />
            ) : (
              <Volume2 className="w-6 h-6 text-text-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={clsx(
                'text-sm font-medium truncate transition-all duration-300',
                isPlaying && ''
              )}
            >
              {friendlyName}
            </p>
            {mediaTitle && (
              <p
                className={clsx(
                  'text-xs truncate transition-all duration-300',
                  isPlaying ? 'text-accent' : 'text-accent'
                )}
              >
                {mediaTitle}
              </p>
            )}
            {mediaArtist && (
              <p className="text-xs text-text-secondary truncate">{mediaArtist}</p>
            )}
            {!mediaTitle && !mediaArtist && (
              <p className="text-xs text-text-secondary">
                {isPlaying ? 'Spielt ab' : isIdle ? 'Idle' : state}
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button className="p-2 rounded-full hover:bg-surface-hover transition-all duration-200 text-text-secondary hover:text-text-primary">
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={() => (isPlaying ? pause() : play())}
            className={clsx(
              'p-3 rounded-full transition-all duration-300',
              isPlaying
                ? 'bg-accent text-on-fill'
                : 'bg-surface-hover text-text-primary hover:bg-accent hover:text-on-fill'
            )}
            style={{
              boxShadow: isPlaying
                ? '0 0 20px rgb(from var(--color-accent) r g b / 0.5)'
                : 'none',
            }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6" />
            )}
          </button>
          <button className="p-2 rounded-full hover:bg-surface-hover transition-all duration-200 text-text-secondary hover:text-text-primary">
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVolume(isMuted ? 0.5 : 0)}
            className={clsx(
              'p-1.5 rounded hover:bg-surface-hover transition-all duration-200',
              isMuted || volumePercent === 0 ? 'text-text-secondary' : 'text-accent'
            )}
          >
            {isMuted || volumePercent === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <Slider
            value={volumePercent}
            onChange={(v) => setVolume(v / 100)}
            min={0}
            max={100}
            className="flex-1"
            glowIntensity
          />
          <span
            className={clsx(
              'text-xs w-8 text-right tabular-nums',
              volumePercent > 0 ? 'text-accent' : 'text-text-secondary'
            )}
          >
            {volumePercent}%
          </span>
        </div>
      </div>
    </Card>
  )
}
