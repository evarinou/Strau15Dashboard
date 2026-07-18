import { useState } from 'react'
import { AlarmClock, Bell, BellOff, Sun, Briefcase, Calendar, Clock, ChevronDown, ChevronUp, Sunrise, Coffee, Timer } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Toggle } from '../ui/Toggle'
import { Slider } from '../ui/Slider'
import { useAlarm, type AlarmMode } from '../../contexts/HomeAssistantContext'

interface AlarmWidgetProps {
  variant?: 'mini' | 'compact' | 'full'
  entrance?: boolean
  entranceDelay?: number
}

const MODE_CONFIG: Record<AlarmMode, { icon: typeof Calendar; label: string; color: string }> = {
  Automatisch: {
    icon: Calendar,
    label: 'Automatisch',
    color: 'text-accent',
  },
  'Jeden Tag': {
    icon: Sun,
    label: 'Täglich',
    color: 'text-warning',
  },
  'Nur Werktage': {
    icon: Briefcase,
    label: 'Werktage',
    color: 'text-cyan-400',
  },
  'Nur Wochenende': {
    icon: Sun,
    label: 'Wochenende',
    color: 'text-success',
  },
  Aus: {
    icon: BellOff,
    label: 'Aus',
    color: 'text-text-secondary',
  },
}

const AVAILABLE_MODES: AlarmMode[] = ['Automatisch', 'Jeden Tag', 'Nur Werktage', 'Nur Wochenende', 'Aus']

function TimeInput({
  value,
  onChange,
  label,
  disabled,
}: {
  value: string | null
  onChange: (time: string) => void
  label: string
  disabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-text-secondary">{label}</span>
      <input
        type="time"
        value={value || '07:00'}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          'bg-surface-hover border border-border/50 rounded-lg px-3 py-1.5',
          'text-lg font-mono tabular-nums text-text-primary',
          'focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50',
          'transition-all duration-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      />
    </div>
  )
}

export function AlarmWidget({
  variant = 'compact',
  entrance = false,
  entranceDelay = 0,
}: AlarmWidgetProps) {
  const alarm = useAlarm()
  const [expanded, setExpanded] = useState(false)

  if (!alarm.isAvailable) {
    return (
      <Card entrance={entrance} entranceDelay={entranceDelay}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlarmClock className="w-4 h-4" />
            Wecker
          </CardTitle>
        </CardHeader>
        <div className="text-center py-4 text-text-secondary">
          <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Nicht verfügbar</p>
        </div>
      </Card>
    )
  }

  const modeConfig = MODE_CONFIG[alarm.mode]
  const ModeIcon = modeConfig.icon
  const isActive = alarm.isEnabled && alarm.mode !== 'Aus'

  // Mini variant for dashboard 2x2 grid
  if (variant === 'mini') {
    return (
      <Card
        entrance={entrance}
        entranceDelay={entranceDelay}
        className="!p-3"
      >
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300',
              isActive ? 'bg-accent/20' : 'bg-surface-hover'
            )}
            style={{
              boxShadow: isActive ? '0 0 12px rgb(216 90 48 / 0.3)' : undefined,
            }}
          >
            {isActive ? (
              <Bell className={clsx('w-5 h-5 text-accent', isActive && 'animate-float')} />
            ) : (
              <BellOff className="w-5 h-5 text-text-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={clsx(
                'text-lg font-bold font-mono tabular-nums transition-all duration-300',
                isActive ? 'text-text-primary' : 'text-text-secondary'
              )}
            >
              {alarm.nextAlarmTime || '--:--'}
            </p>
            <p className="text-xs text-text-secondary truncate">
              {isActive ? modeConfig.label : 'Wecker aus'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  // Compact variant for dashboard sidebar
  if (variant === 'compact') {
    return (
      <Card
        entrance={entrance}
        entranceDelay={entranceDelay}
        className={clsx(
          'overflow-hidden transition-all duration-300',
          isActive && 'border-accent/30'
        )}
        style={{
          boxShadow: isActive ? '0 0 20px rgb(216 90 48 / 0.1)' : undefined,
        }}
      >
        {/* Background glow when active */}
        {isActive && (
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgb(216 90 48 / 0.15), transparent 70%)',
            }}
          />
        )}

        <CardHeader className="relative z-10">
          <CardTitle className="flex items-center gap-2" glow={isActive}>
            <AlarmClock className={clsx('w-4 h-4', isActive && 'text-accent')} />
            Wecker
          </CardTitle>
          <Toggle
            checked={alarm.isEnabled}
            onChange={alarm.setEnabled}
            size="sm"
          />
        </CardHeader>

        <div className="relative z-10">
          {/* Main time display */}
          <div className="flex items-center gap-4 mb-3">
            <div
              className={clsx(
                'w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300',
                isActive ? 'bg-accent/20' : 'bg-surface-hover/50'
              )}
              style={{
                boxShadow: isActive ? '0 0 15px rgb(216 90 48 / 0.3)' : undefined,
              }}
            >
              {isActive ? (
                <Bell className="w-7 h-7 text-accent animate-float" />
              ) : (
                <BellOff className="w-7 h-7 text-text-secondary" />
              )}
            </div>

            <div className="flex-1">
              <p
                className={clsx(
                  'text-3xl font-bold font-mono tabular-nums transition-all duration-300',
                  isActive ? 'text-text-primary' : 'text-text-secondary'
                )}
              >
                {alarm.nextAlarmTime || '--:--'}
              </p>
              <p className="text-xs text-text-secondary">{alarm.nextAlarmLabel}</p>
            </div>
          </div>

          {/* Mode indicator */}
          <div className="flex items-center justify-between text-sm">
            <div className={clsx('flex items-center gap-1.5', modeConfig.color)}>
              <ModeIcon className="w-4 h-4" />
              <span>{modeConfig.label}</span>
            </div>

            {/* Expand button */}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-surface-hover transition-colors text-text-secondary"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded settings */}
          {expanded && (
            <div className="mt-4 pt-4 border-t border-border/30 space-y-4 animate-entrance">
              {/* Mode selector */}
              <div className="space-y-2">
                <p className="text-xs text-text-secondary uppercase tracking-wide">Modus</p>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_MODES.map((mode) => {
                    const config = MODE_CONFIG[mode]
                    const Icon = config.icon
                    const isSelected = alarm.mode === mode

                    return (
                      <button
                        key={mode}
                        onClick={() => alarm.setMode(mode)}
                        className={clsx(
                          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
                          'transition-all duration-200',
                          isSelected
                            ? 'bg-accent/20 text-accent border border-accent/30'
                            : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80'
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Time settings based on mode */}
              {alarm.mode !== 'Aus' && (
                <div className="space-y-3">
                  {(alarm.mode === 'Automatisch' || alarm.mode === 'Nur Werktage') && (
                    <TimeInput
                      label="Werktage"
                      value={alarm.weekdayTime}
                      onChange={alarm.setWeekdayTime}
                    />
                  )}
                  {(alarm.mode === 'Automatisch' || alarm.mode === 'Nur Wochenende') && (
                    <TimeInput
                      label="Wochenende"
                      value={alarm.weekendTime}
                      onChange={alarm.setWeekendTime}
                    />
                  )}
                  {alarm.mode === 'Jeden Tag' && (
                    <TimeInput
                      label="Täglich"
                      value={alarm.standardTime}
                      onChange={alarm.setStandardTime}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    )
  }

  // Full variant for room page
  return (
    <Card entrance={entrance} entranceDelay={entranceDelay}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2" glow={isActive}>
          <AlarmClock className={clsx('w-4 h-4', isActive && 'text-accent icon-glow-accent')} />
          Wecker
        </CardTitle>
        <Toggle
          checked={alarm.isEnabled}
          onChange={alarm.setEnabled}
        />
      </CardHeader>

      <div className="space-y-6">
        {/* Large time display */}
        <div className="text-center">
          <div
            className={clsx(
              'w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center transition-all duration-300',
              isActive ? 'bg-accent/20' : 'bg-surface-hover'
            )}
            style={{
              boxShadow: isActive ? '0 0 30px rgb(216 90 48 / 0.3)' : undefined,
            }}
          >
            {isActive ? (
              <Bell className="w-10 h-10 text-accent animate-float icon-glow-accent" />
            ) : (
              <BellOff className="w-10 h-10 text-text-secondary" />
            )}
          </div>

          <p
            className={clsx(
              'text-5xl font-bold font-mono tabular-nums transition-all duration-300',
              isActive ? 'text-text-primary text-glow-accent' : 'text-text-secondary'
            )}
          >
            {alarm.nextAlarmTime || '--:--'}
          </p>
          <p className="text-sm text-text-secondary mt-1">{alarm.nextAlarmLabel}</p>
        </div>

        {/* Mode selector */}
        <div className="space-y-2">
          <p className="text-xs text-text-secondary uppercase tracking-wide">Modus</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {AVAILABLE_MODES.map((mode) => {
              const config = MODE_CONFIG[mode]
              const Icon = config.icon
              const isSelected = alarm.mode === mode

              return (
                <button
                  key={mode}
                  onClick={() => alarm.setMode(mode)}
                  className={clsx(
                    'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium',
                    'transition-all duration-200',
                    isSelected
                      ? 'bg-accent/20 text-accent border border-accent/30'
                      : 'bg-surface-hover text-text-secondary hover:bg-surface-hover/80 border border-transparent'
                  )}
                  style={{
                    boxShadow: isSelected ? '0 0 10px rgb(216 90 48 / 0.2)' : undefined,
                  }}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time settings */}
        {alarm.mode !== 'Aus' && (
          <div className="space-y-4 pt-4 border-t border-border/30">
            <div className="flex items-center gap-2 text-text-secondary">
              <Clock className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wide">Weckzeiten</span>
            </div>

            <div className="space-y-3">
              {(alarm.mode === 'Automatisch' || alarm.mode === 'Nur Werktage') && (
                <TimeInput
                  label="Werktage (Mo-Fr)"
                  value={alarm.weekdayTime}
                  onChange={alarm.setWeekdayTime}
                />
              )}
              {(alarm.mode === 'Automatisch' || alarm.mode === 'Nur Wochenende') && (
                <TimeInput
                  label="Wochenende (Sa-So)"
                  value={alarm.weekendTime}
                  onChange={alarm.setWeekendTime}
                />
              )}
              {alarm.mode === 'Jeden Tag' && (
                <TimeInput
                  label="Jeden Tag"
                  value={alarm.standardTime}
                  onChange={alarm.setStandardTime}
                />
              )}
            </div>
          </div>
        )}

        {/* Wake-up options */}
        <div className="space-y-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-2 text-text-secondary">
            <Sunrise className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wide">Aufwach-Optionen</span>
          </div>

          {/* Sunrise light toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'w-9 h-9 rounded-lg flex items-center justify-center',
                  alarm.sunriseEnabled ? 'bg-warning/20' : 'bg-surface-hover'
                )}>
                  <Sunrise className={clsx(
                    'w-5 h-5',
                    alarm.sunriseEnabled ? 'text-warning' : 'text-text-secondary'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-medium">Aufwachlicht</p>
                  <p className="text-xs text-text-secondary">Sonnenaufgang-Effekt</p>
                </div>
              </div>
              <Toggle
                checked={alarm.sunriseEnabled}
                onChange={alarm.setSunriseEnabled}
              />
            </div>

            {/* Sunrise duration slider */}
            {alarm.sunriseEnabled && (
              <div className="pl-12 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Dauer</span>
                  <span className="font-mono text-text-primary">{alarm.sunriseDuration} min</span>
                </div>
                <Slider
                  value={alarm.sunriseDuration}
                  onChange={alarm.setSunriseDuration}
                  min={5}
                  max={30}
                  step={1}
                />
              </div>
            )}
          </div>

          {/* Coffee machine toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={clsx(
                'w-9 h-9 rounded-lg flex items-center justify-center',
                alarm.coffeeEnabled ? 'bg-amber-500/20' : 'bg-surface-hover'
              )}>
                <Coffee className={clsx(
                  'w-5 h-5',
                  alarm.coffeeEnabled ? 'text-amber-500' : 'text-text-secondary'
                )} />
              </div>
              <div>
                <p className="text-sm font-medium">Kaffeemaschine</p>
                <p className="text-xs text-text-secondary">Beim Aufstehen einschalten</p>
              </div>
            </div>
            <Toggle
              checked={alarm.coffeeEnabled}
              onChange={alarm.setCoffeeEnabled}
            />
          </div>

          {/* Snooze duration */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface-hover">
                <Timer className="w-5 h-5 text-text-secondary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Snooze Dauer</p>
                  <span className="font-mono text-sm text-text-primary">{alarm.snoozeDuration} min</span>
                </div>
              </div>
            </div>
            <div className="pl-12">
              <Slider
                value={alarm.snoozeDuration}
                onChange={alarm.setSnoozeDuration}
                min={1}
                max={15}
                step={1}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
