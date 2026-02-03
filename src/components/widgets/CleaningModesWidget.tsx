import { Wind, Droplets } from 'lucide-react'
import { clsx } from 'clsx'
import type { FanSpeedMode, MopIntensity } from '../../contexts/HomeAssistantContext'

interface CleaningModesWidgetProps {
  fanSpeed: FanSpeedMode
  fanSpeedList: FanSpeedMode[]
  mopIntensity: MopIntensity
  mopIntensityList: MopIntensity[]
  onFanSpeedChange: (mode: FanSpeedMode) => void
  onMopIntensityChange: (level: MopIntensity) => void
}

const FAN_SPEED_LABELS: Record<FanSpeedMode, string> = {
  Silent: 'Leise',
  Standard: 'Standard',
  Medium: 'Mittel',
  Turbo: 'Turbo',
}

const FAN_SPEED_COLORS: Record<FanSpeedMode, string> = {
  Silent: 'oklch(0.627 0.194 149.21)',
  Standard: 'oklch(0.623 0.214 259.13)',
  Medium: 'oklch(0.769 0.188 70.08)',
  Turbo: 'oklch(0.577 0.245 27.33)',
}

const MOP_INTENSITY_LABELS: Record<MopIntensity, string> = {
  Off: 'Aus',
  Low: 'Niedrig',
  Medium: 'Mittel',
  High: 'Hoch',
}

const MOP_INTENSITY_COLORS: Record<MopIntensity, string> = {
  Off: 'oklch(0.708 0.014 285.82)',
  Low: 'oklch(0.627 0.194 149.21)',
  Medium: 'oklch(0.623 0.214 259.13)',
  High: 'oklch(0.85 0.18 195)',
}

interface SegmentedButtonGroupProps<T extends string> {
  value: T
  options: T[]
  labels: Record<T, string>
  colors: Record<T, string>
  onChange: (value: T) => void
  icon?: React.ReactNode
  label: string
}

function SegmentedButtonGroup<T extends string>({
  value,
  options,
  labels,
  colors,
  onChange,
  icon,
  label,
}: SegmentedButtonGroupProps<T>) {
  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        {icon}
        <span>{label}</span>
      </div>

      {/* Segmented buttons */}
      <div className="flex rounded-xl bg-surface-elevated/50 p-1 gap-1">
        {options.map((option) => {
          const isActive = value === option
          const color = colors[option]

          return (
            <button
              key={option}
              onClick={() => onChange(option)}
              className={clsx(
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                isActive
                  ? 'text-white shadow-md'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
              )}
              style={{
                backgroundColor: isActive ? color : undefined,
                boxShadow: isActive ? `0 0 15px ${color.replace(')', ' / 0.4)')}` : undefined,
              }}
            >
              {labels[option]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function CleaningModesWidget({
  fanSpeed,
  fanSpeedList,
  mopIntensity,
  mopIntensityList,
  onFanSpeedChange,
  onMopIntensityChange,
}: CleaningModesWidgetProps) {
  return (
    <div className="space-y-4">
      {/* Fan Speed */}
      <SegmentedButtonGroup
        value={fanSpeed}
        options={fanSpeedList}
        labels={FAN_SPEED_LABELS}
        colors={FAN_SPEED_COLORS}
        onChange={onFanSpeedChange}
        icon={<Wind className="w-4 h-4" />}
        label="Saugstärke"
      />

      {/* Mop Intensity */}
      <SegmentedButtonGroup
        value={mopIntensity}
        options={mopIntensityList}
        labels={MOP_INTENSITY_LABELS}
        colors={MOP_INTENSITY_COLORS}
        onChange={onMopIntensityChange}
        icon={<Droplets className="w-4 h-4" />}
        label="Wischintensität"
      />
    </div>
  )
}
