import { clsx } from 'clsx'

export interface ColorPreset {
  name: string
  rgb: [number, number, number]
  temp?: number
}

export const COLOR_PRESETS: ColorPreset[] = [
  { name: 'Warmweiß', rgb: [255, 180, 107], temp: 400 },
  { name: 'Kaltweiß', rgb: [255, 255, 255], temp: 200 },
  { name: 'Rot', rgb: [255, 0, 0] },
  { name: 'Orange', rgb: [255, 165, 0] },
  { name: 'Gelb', rgb: [255, 255, 0] },
  { name: 'Grün', rgb: [0, 255, 0] },
  { name: 'Cyan', rgb: [0, 255, 255] },
  { name: 'Blau', rgb: [0, 0, 255] },
  { name: 'Lila', rgb: [128, 0, 255] },
  { name: 'Pink', rgb: [255, 0, 128] },
]

interface ColorPresetsProps {
  onSelectColor?: (rgb: [number, number, number]) => void
  onSelectTemp?: (mireds: number) => void
  currentColor?: [number, number, number]
  supportsColor?: boolean
  supportsColorTemp?: boolean
  className?: string
}

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  return Math.sqrt(
    Math.pow(c1[0] - c2[0], 2) +
    Math.pow(c1[1] - c2[1], 2) +
    Math.pow(c1[2] - c2[2], 2)
  )
}

export function ColorPresets({
  onSelectColor,
  onSelectTemp,
  currentColor,
  supportsColor = true,
  supportsColorTemp = false,
  className,
}: ColorPresetsProps) {
  const handleSelect = (preset: ColorPreset) => {
    // If the preset has a temp and we support color temp, prefer that for white presets
    if (preset.temp && supportsColorTemp && onSelectTemp) {
      onSelectTemp(preset.temp)
    } else if (supportsColor && onSelectColor) {
      onSelectColor(preset.rgb)
    }
  }

  // Filter presets based on what the light supports
  const visiblePresets = COLOR_PRESETS.filter(preset => {
    // White presets are available if we support color temp OR color
    if (preset.temp) {
      return supportsColorTemp || supportsColor
    }
    // Color presets only if we support color
    return supportsColor
  })

  return (
    <div className={clsx('flex gap-2 overflow-x-auto pb-1 scrollbar-thin', className)}>
      {visiblePresets.map((preset) => {
        const isSelected = currentColor && colorDistance(currentColor, preset.rgb) < 50
        const rgbString = `rgb(${preset.rgb[0]}, ${preset.rgb[1]}, ${preset.rgb[2]})`

        return (
          <button
            key={preset.name}
            onClick={(e) => {
              e.stopPropagation()
              handleSelect(preset)
            }}
            className={clsx(
              'flex-shrink-0 w-8 h-8 rounded-full transition-all duration-200',
              'hover:scale-110 active:scale-95',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              // Ring in Tinte statt in Weiß: das weiße Feld „Kaltweiß"
              // hatte vorher einen Auswahlring, den man nicht sah.
              isSelected && 'ring-2 ring-ink ring-offset-2 ring-offset-white/60 scale-110'
            )}
            style={{
              backgroundColor: rgbString,
              boxShadow: isSelected
                ? `0 0 14px ${rgbString}`
                : 'var(--shadow-float)',
            }}
            title={preset.name}
            aria-label={preset.name}
          />
        )
      })}
    </div>
  )
}
