import { useRef, useState, useCallback, useEffect } from 'react'
import { clsx } from 'clsx'

interface ColorPickerProps {
  value?: [number, number] // [hue, saturation] - HS color
  onChange?: (hs: [number, number]) => void
  className?: string
}

// Convert HS to RGB for display
function hsToRgb(h: number, s: number): [number, number, number] {
  const hNorm = h / 360
  const sNorm = s / 100
  const l = 0.5 // Fixed lightness for display

  if (sNorm === 0) {
    const v = Math.round(l * 255)
    return [v, v, v]
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }

  const q = l < 0.5 ? l * (1 + sNorm) : l + sNorm - l * sNorm
  const p = 2 * l - q

  return [
    Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hNorm) * 255),
    Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  ]
}

export function ColorPicker({ value, onChange, className }: ColorPickerProps) {
  const wheelRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const hue = value?.[0] ?? 0
  const saturation = value?.[1] ?? 100

  const updateColorFromPosition = useCallback(
    (clientX: number, clientY: number) => {
      if (!wheelRef.current || !onChange) return

      const rect = wheelRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const deltaX = clientX - centerX
      const deltaY = clientY - centerY

      // Calculate angle (hue) - 0 at top, clockwise
      let angle = Math.atan2(deltaX, -deltaY) * (180 / Math.PI)
      if (angle < 0) angle += 360

      // Calculate distance from center (saturation)
      const radius = rect.width / 2
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), radius)
      const sat = (distance / radius) * 100

      onChange([Math.round(angle), Math.round(sat)])
    },
    [onChange]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      setIsDragging(true)
      updateColorFromPosition(e.clientX, e.clientY)
    },
    [updateColorFromPosition]
  )

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation()
      setIsDragging(true)
      const touch = e.touches[0]
      updateColorFromPosition(touch.clientX, touch.clientY)
    },
    [updateColorFromPosition]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      updateColorFromPosition(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      updateColorFromPosition(touch.clientX, touch.clientY)
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, updateColorFromPosition])

  // Calculate thumb position
  const radius = 50 // 50% of the container
  const thumbDistance = (saturation / 100) * radius
  const thumbAngle = (hue - 90) * (Math.PI / 180) // -90 to start from top
  const thumbX = 50 + thumbDistance * Math.cos(thumbAngle)
  const thumbY = 50 + thumbDistance * Math.sin(thumbAngle)

  const currentRgb = hsToRgb(hue, saturation)
  const currentColorString = `rgb(${currentRgb[0]}, ${currentRgb[1]}, ${currentRgb[2]})`

  return (
    <div
      ref={wheelRef}
      className={clsx(
        'relative w-32 h-32 rounded-full cursor-pointer touch-none select-none',
        className
      )}
      style={{
        background: `
          radial-gradient(circle, white 0%, transparent 70%),
          conic-gradient(
            from 0deg,
            hsl(0, 100%, 50%),
            hsl(60, 100%, 50%),
            hsl(120, 100%, 50%),
            hsl(180, 100%, 50%),
            hsl(240, 100%, 50%),
            hsl(300, 100%, 50%),
            hsl(360, 100%, 50%)
          )
        `,
        boxShadow: 'inset 0 0 0 1px rgb(211 209 199 / 0.5)',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Thumb indicator */}
      <div
        className={clsx(
          'absolute w-6 h-6 rounded-full border-2 border-white -translate-x-1/2 -translate-y-1/2',
          'transition-transform duration-75',
          isDragging && 'scale-110'
        )}
        style={{
          left: `${thumbX}%`,
          top: `${thumbY}%`,
          backgroundColor: currentColorString,
          boxShadow: `0 0 8px ${currentColorString}, 0 2px 4px oklch(0 0 0 / 0.3)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
