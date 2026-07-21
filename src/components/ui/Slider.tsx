import { type CSSProperties, type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  /** Weicher Akzentschimmer am Griff, der mit dem Wert zunimmt. */
  glowIntensity?: boolean
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      glowIntensity = true,
      disabled,
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100

    /*
     * Der Griffschatten läuft über eine CSS-Variable am Element.
     *
     * Vorher injizierte jede Slider-Instanz ein <style> mit dem
     * GLOBALEN Selektor input[type=range]::-webkit-slider-thumb —
     * damit hat der zuletzt gerenderte Slider die Griffe aller
     * anderen auf der Seite überschrieben. Auf der Lichter-Seite
     * bekamen so alle Lampen den Schimmer der letzten.
     */
    const halo =
      glowIntensity && percentage > 0
        ? `0 0 ${Math.round(6 + (percentage / 100) * 10)}px rgb(from var(--color-accent) r g b / ${(0.25 + (percentage / 100) * 0.35).toFixed(2)})`
        : null

    const style = {
      background: `linear-gradient(to right,
        var(--color-accent) 0%, var(--color-accent) ${percentage}%,
        var(--color-surface-hover) ${percentage}%, var(--color-surface-hover) 100%)`,
      '--thumb-shadow': halo
        ? `${halo}, 0 2px 6px rgb(84 60 118 / 0.25)`
        : '0 2px 6px rgb(84 60 118 / 0.25)',
    } as CSSProperties

    return (
      <div className={clsx('relative w-full', className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange?.(Number(e.target.value))}
          className={clsx(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Webkit thumb
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:active:scale-95',
            // Firefox thumb
            '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer'
          )}
          style={style}
          {...props}
        />
      </div>
    )
  }
)

Slider.displayName = 'Slider'
