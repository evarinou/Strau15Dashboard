import { type InputHTMLAttributes, forwardRef, useMemo } from 'react'
import { clsx } from 'clsx'

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
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

    // Calculate glow intensity based on value
    const glowOpacity = useMemo(() => {
      if (!glowIntensity) return 0
      return 0.2 + (percentage / 100) * 0.4 // 0.2 to 0.6
    }, [glowIntensity, percentage])

    const thumbGlow = useMemo(() => {
      if (!glowIntensity || percentage === 0) return 'none'
      const intensity = 8 + (percentage / 100) * 12 // 8px to 20px
      return `0 0 ${intensity}px rgb(216 90 48 / ${glowOpacity})`
    }, [glowIntensity, percentage, glowOpacity])

    return (
      <div className={clsx('relative w-full group', className)}>
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
            'bg-surface-hover',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            // Webkit thumb
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white',
            '[&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200',
            '[&::-webkit-slider-thumb]:hover:scale-110',
            '[&::-webkit-slider-thumb]:active:scale-95',
            // Firefox thumb
            '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white',
            '[&::-moz-range-thumb]:border-0',
            '[&::-moz-range-thumb]:cursor-pointer',
            '[&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-200'
          )}
          style={{
            background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percentage}%, var(--color-surface-hover) ${percentage}%, var(--color-surface-hover) 100%)`,
            // Add glow to the filled portion
            boxShadow:
              percentage > 0 && glowIntensity
                ? `inset 0 0 8px rgb(216 90 48 / ${glowOpacity * 0.5})`
                : 'none',
          }}
          {...props}
        />
        {/* Glow track overlay */}
        {glowIntensity && percentage > 0 && (
          <div
            className="absolute top-1/2 left-0 h-2 rounded-full pointer-events-none -translate-y-1/2 transition-all duration-200"
            style={{
              width: `${percentage}%`,
              boxShadow: `0 0 12px rgb(216 90 48 / ${glowOpacity})`,
            }}
          />
        )}
        {/* Custom thumb glow overlay */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              input[type="range"]::-webkit-slider-thumb {
                box-shadow: ${thumbGlow}, 0 2px 6px oklch(0 0 0 / 0.3);
              }
              input[type="range"]::-moz-range-thumb {
                box-shadow: ${thumbGlow}, 0 2px 6px oklch(0 0 0 / 0.3);
              }
            `,
          }}
        />
      </div>
    )
  }
)

Slider.displayName = 'Slider'
