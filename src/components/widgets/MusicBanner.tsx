import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { clsx } from 'clsx'
import { Slider } from '../ui/Slider'
import { useMediaPlayer } from '../../contexts/HomeAssistantContext'

interface MusicBannerProps {
  entityId: string
}

// Compact equalizer for banner
function EqualizerBars({ isPlaying }: { isPlaying: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={clsx(
            'w-0.5 bg-neon-cyan rounded-full transition-all',
            isPlaying ? 'animate-[eq-bar_0.4s_ease-in-out_infinite]' : 'h-0.5'
          )}
          style={{
            height: isPlaying ? undefined : '2px',
            animationDelay: isPlaying ? `${i * 0.08}s` : undefined,
            boxShadow: isPlaying
              ? '0 0 4px oklch(0.85 0.18 195 / 0.6)'
              : 'none',
          }}
        />
      ))}
    </div>
  )
}

export function MusicBanner({ entityId }: MusicBannerProps) {
  const {
    isPlaying,
    isPaused,
    isUnavailable,
    volume,
    isMuted,
    mediaTitle,
    mediaArtist,
    friendlyName,
    entityPicture,
    play,
    pause,
    setVolume,
  } = useMediaPlayer(entityId)

  // Only show banner when music is playing or paused
  if (isUnavailable || (!isPlaying && !isPaused)) {
    return null
  }

  const volumePercent = Math.round((volume || 0) * 100)

  return (
    <div className="animate-slide-in-top mb-6">
      <div
        className={clsx(
          'relative rounded-xl overflow-hidden',
          'glass-heavy border',
          isPlaying ? 'border-neon-cyan/30 border-glow-cyan' : 'border-border/30'
        )}
      >
        {/* Gradient background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isPlaying
              ? 'linear-gradient(135deg, oklch(0.85 0.18 195 / 0.1) 0%, transparent 50%)'
              : 'linear-gradient(135deg, oklch(0.4 0.02 285 / 0.1) 0%, transparent 50%)',
          }}
        />

        <div className="relative z-10 p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Album art or equalizer */}
            <button
              onClick={() => (isPlaying ? pause() : play())}
              className={clsx(
                'relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg flex items-center justify-center transition-all duration-300 touch-target haptic-feedback',
                isPlaying
                  ? 'bg-neon-cyan/20'
                  : 'bg-surface-hover hover:bg-surface-hover/80'
              )}
              style={{
                boxShadow: isPlaying
                  ? '0 0 20px oklch(0.85 0.18 195 / 0.4)'
                  : 'none',
              }}
            >
              {entityPicture ? (
                <img
                  src={entityPicture}
                  alt="Album art"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 text-neon-cyan icon-glow-cyan" />
              ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 text-text-secondary" />
              )}

              {/* Breathing pulse when playing */}
              {isPlaying && (
                <div
                  className="absolute inset-0 rounded-lg animate-breathe pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle, oklch(0.85 0.18 195 / 0.2) 0%, transparent 70%)',
                  }}
                />
              )}
            </button>

            {/* Track info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary truncate">{friendlyName}</span>
                {isPlaying && <EqualizerBars isPlaying={isPlaying} />}
              </div>
              <p
                className={clsx(
                  'text-sm sm:text-base font-medium truncate transition-all duration-300',
                  isPlaying && 'text-glow-cyan'
                )}
              >
                {mediaTitle || (isPlaying ? 'Spielt ab...' : 'Pausiert')}
              </p>
              {mediaArtist && (
                <p className="text-xs sm:text-sm text-text-secondary truncate">
                  {mediaArtist}
                </p>
              )}
            </div>

            {/* Volume control - hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-2 w-28">
              <button
                onClick={() => setVolume(isMuted ? 0.5 : 0)}
                className={clsx(
                  'p-1.5 rounded hover:bg-surface-hover transition-all duration-200 touch-target haptic-feedback',
                  isMuted || volumePercent === 0 ? 'text-text-secondary' : 'text-neon-cyan'
                )}
              >
                {isMuted || volumePercent === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4 icon-glow-cyan" />
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
            </div>

            {/* Play/Pause button - visible only on small mobile */}
            <button
              onClick={() => (isPlaying ? pause() : play())}
              className={clsx(
                'sm:hidden flex-shrink-0 p-2.5 rounded-full transition-all duration-300 touch-target haptic-feedback',
                isPlaying
                  ? 'bg-neon-cyan text-white'
                  : 'bg-surface-hover text-text-primary hover:bg-neon-cyan hover:text-white'
              )}
              style={{
                boxShadow: isPlaying
                  ? '0 0 15px oklch(0.85 0.18 195 / 0.5)'
                  : 'none',
              }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Progress shimmer line at bottom when playing */}
        {isPlaying && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent animate-progress-shimmer"
              style={{
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
