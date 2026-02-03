import { useState } from 'react'
import { Lightbulb, LightbulbOff, Palette } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { Slider } from '../ui/Slider'
import { ColorPresets } from '../ui/ColorPresets'
import { ColorPicker } from '../ui/ColorPicker'
import { ColorTempSlider } from '../ui/ColorTempSlider'
import { useLight } from '../../contexts/HomeAssistantContext'

interface LightWidgetProps {
  entityId: string
  showSlider?: boolean
  entrance?: boolean
  entranceDelay?: number
}

export function LightWidget({
  entityId,
  showSlider = false,
  entrance = false,
  entranceDelay = 0,
}: LightWidgetProps) {
  const {
    isOn,
    isUnavailable,
    brightness,
    friendlyName,
    toggle,
    setBrightness,
    rgbColor,
    hsColor,
    colorTemp,
    minMireds,
    maxMireds,
    supportsColor,
    supportsColorTemp,
    setRgbColor,
    setHsColor,
    setColorTemp,
  } = useLight(entityId)
  const [localBrightness, setLocalBrightness] = useState<number | null>(null)
  const [isPressed, setIsPressed] = useState(false)
  const [showAdvancedColor, setShowAdvancedColor] = useState(false)

  const displayBrightness = localBrightness ?? brightness ?? 255
  const brightnessPercent = Math.round((displayBrightness / 255) * 100)

  // Calculate glow intensity based on brightness
  const glowIntensity = isOn ? 0.2 + (brightnessPercent / 100) * 0.4 : 0

  const handleBrightnessChange = (value: number) => {
    setLocalBrightness(Math.round((value / 100) * 255))
  }

  const handleBrightnessCommit = () => {
    if (localBrightness !== null) {
      setBrightness(localBrightness)
      setLocalBrightness(null)
    }
  }

  return (
    <Card
      variant="interactive"
      entrance={entrance}
      entranceDelay={entranceDelay}
      glowOnActive={isOn}
      glowColor="warning"
      className={clsx(
        'cursor-pointer select-none transition-all duration-300',
        isPressed && 'scale-[0.98]',
        isUnavailable && 'opacity-50'
      )}
      onClick={() => !isUnavailable && toggle()}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
    >
      <div className="flex items-center gap-3">
        {/* Status Orb with breathing ring */}
        <div className="relative">
          {/* Outer breathing ring when on */}
          {isOn && (
            <div
              className="absolute inset-0 rounded-full animate-breathe-warm"
              style={{
                background: `radial-gradient(circle, oklch(0.769 0.188 70.08 / ${glowIntensity}) 0%, transparent 70%)`,
                transform: 'scale(1.5)',
              }}
            />
          )}
          {/* Main icon container */}
          <div
            className={clsx(
              'relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300',
              isOn
                ? 'bg-warning/20 text-warning'
                : 'bg-surface-hover text-text-secondary'
            )}
            style={{
              boxShadow: isOn
                ? `0 0 ${12 + brightnessPercent * 0.1}px oklch(0.769 0.188 70.08 / ${glowIntensity})`
                : 'none',
            }}
          >
            {isOn ? (
              <Lightbulb
                className={clsx(
                  'w-5 h-5 transition-all duration-300',
                  isOn && 'icon-glow-warning'
                )}
              />
            ) : (
              <LightbulbOff className="w-5 h-5" />
            )}
          </div>
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              'text-sm font-medium truncate transition-all duration-300',
              isOn && 'text-glow-warning'
            )}
          >
            {friendlyName || entityId}
          </p>
          <p className="text-xs text-text-secondary">
            {isUnavailable ? 'Nicht verfügbar' : isOn ? `${brightnessPercent}%` : 'Aus'}
          </p>
        </div>
      </div>

      {/* Brightness slider with glow */}
      {showSlider && isOn && !isUnavailable && (
        <div
          className="mt-3 pt-3 border-t border-border/50"
          onClick={(e) => e.stopPropagation()}
        >
          <Slider
            value={brightnessPercent}
            onChange={handleBrightnessChange}
            onMouseUp={handleBrightnessCommit}
            onTouchEnd={handleBrightnessCommit}
            min={1}
            max={100}
            glowIntensity
          />
        </div>
      )}

      {/* Color controls */}
      {isOn && !isUnavailable && (supportsColor || supportsColorTemp) && (
        <div
          className="mt-3 pt-3 border-t border-border/50 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Presets row with expand button */}
          <div className="flex items-center gap-2">
            <ColorPresets
              onSelectColor={setRgbColor}
              onSelectTemp={setColorTemp}
              currentColor={rgbColor}
              supportsColor={supportsColor}
              supportsColorTemp={supportsColorTemp}
              className="flex-1"
            />
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowAdvancedColor(!showAdvancedColor)
              }}
              className={clsx(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200',
                'hover:bg-surface-hover active:scale-95',
                showAdvancedColor
                  ? 'bg-accent/20 text-accent'
                  : 'bg-surface-hover text-text-secondary'
              )}
              title="Erweiterte Farbauswahl"
              aria-label="Erweiterte Farbauswahl"
            >
              <Palette className="w-4 h-4" />
            </button>
          </div>

          {/* Advanced color controls */}
          {showAdvancedColor && (
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              {/* Color wheel */}
              {supportsColor && (
                <div className="flex flex-col items-center gap-2">
                  <ColorPicker
                    value={hsColor}
                    onChange={setHsColor}
                  />
                  <span className="text-xs text-text-secondary">Farbrad</span>
                </div>
              )}

              {/* Color temperature slider */}
              {supportsColorTemp && (
                <div className="flex-1 w-full min-w-0">
                  <ColorTempSlider
                    value={colorTemp ?? 300}
                    onChange={setColorTemp}
                    min={minMireds ?? 153}
                    max={maxMireds ?? 500}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
