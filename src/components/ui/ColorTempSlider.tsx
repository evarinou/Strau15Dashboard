import { type CSSProperties, type InputHTMLAttributes, forwardRef, useMemo } from 'react'
import { clsx } from 'clsx'

interface ColorTempSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: number // mireds
  onChange?: (mireds: number) => void
  min?: number // min mireds (cold, ~153 = 6500K)
  max?: number // max mireds (warm, ~500 = 2000K)
}

// Convert mireds to approximate RGB for display
function miredsToRgb(mireds: number): [number, number, number] {
  // Kelvin = 1,000,000 / mireds
  const kelvin = 1000000 / mireds

  let r: number, g: number, b: number

  // Approximation based on color temperature
  if (kelvin <= 6600) {
    r = 255
    g = Math.round(99.4708025861 * Math.log(kelvin / 100) - 161.1195681661)
    g = Math.max(0, Math.min(255, g))

    if (kelvin <= 1900) {
      b = 0
    } else {
      b = Math.round(138.5177312231 * Math.log(kelvin / 100 - 10) - 305.0447927307)
      b = Math.max(0, Math.min(255, b))
    }
  } else {
    r = Math.round(329.698727446 * Math.pow(kelvin / 100 - 60, -0.1332047592))
    r = Math.max(0, Math.min(255, r))

    g = Math.round(288.1221695283 * Math.pow(kelvin / 100 - 60, -0.0755148492))
    g = Math.max(0, Math.min(255, g))

    b = 255
  }

  return [r, g, b]
}

export const ColorTempSlider = forwardRef<HTMLInputElement, ColorTempSliderProps>(
  (
    {
      className,
      value,
      onChange,
      min = 153, // ~6500K (cool)
      max = 500, // ~2000K (warm)
      disabled,
      ...props
    },
    ref
  ) => {
    // Der Griff trägt die eingestellte Lichtfarbe
    const currentRgb = useMemo(() => miredsToRgb(value), [value])
    const currentColorString = `rgb(${currentRgb[0]}, ${currentRgb[1]}, ${currentRgb[2]})`

    return (
      <div className={clsx('relative w-full group', className)}>
        {/* Labels */}
        <div className="flex justify-between text-xs text-text-secondary mb-1">
          <span>Warm</span>
          <span>Kalt</span>
        </div>

        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className={clsx(
            'w-full h-3 rounded-full appearance-none cursor-pointer',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Webkit thumb
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:active:scale-95',
            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white',
            // Firefox thumb
            '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200'
          )}
          style={
            {
              // Rechts warm, links kalt — der Reglerwert läuft in Mired
              // genau andersherum, deshalb der umgekehrte Verlauf.
              background: 'linear-gradient(to left, #ffb46b, #ffd6a5, #ffffff, #e0eeff, #c9e2ff)',
              boxShadow: 'inset 0 0 0 1px var(--color-border)',
              // Der Griff trägt die eingestellte Lichtfarbe. Läuft über
              // dieselbe Instanz-Variable wie beim normalen Slider —
              // das frühere <style> zielte auf eine Klasse, die dem
              // Input nie zugewiesen wurde, und traf deshalb nichts.
              '--thumb-shadow': `0 0 8px ${currentColorString}, 0 2px 6px rgb(84 60 118 / 0.25)`,
            } as CSSProperties
          }
          {...props}
        />
      </div>
    )
  }
)

ColorTempSlider.displayName = 'ColorTempSlider'
