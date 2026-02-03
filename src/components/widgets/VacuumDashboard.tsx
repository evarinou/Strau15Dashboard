import { Settings, BarChart3, Wrench, Lightbulb, LightbulbOff } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { VacuumStatusBar } from './VacuumStatusBar'
import { VacuumPreviewWidget } from './VacuumPreviewWidget'
import { VacuumControlsWidget } from './VacuumControlsWidget'
import { CleaningModesWidget } from './CleaningModesWidget'
import { CleaningStatsWidget } from './CleaningStatsWidget'
import { ConsumablesWidget } from './ConsumablesWidget'
import { TaskWidget } from './TaskWidget'
import { MediaWidget } from './MediaWidget'
import { useVacuumExtended, useSwitch } from '../../contexts/HomeAssistantContext'
import { useTodayInstances, useRooms } from '../../hooks/useChoreQuest'

interface VacuumDashboardProps {
  entityId?: string
  roomId?: number
  lightEntityId?: string
  mediaPlayerEntityId?: string
}

export function VacuumDashboard({
  entityId = 'vacuum.roborock_s7',
  roomId,
  lightEntityId = 'switch.sonoff_kueche_kueche',
  mediaPlayerEntityId = 'media_player.kuche',
}: VacuumDashboardProps) {
  const vacuum = useVacuumExtended(entityId)
  const kitchenLight = useSwitch(lightEntityId)
  const { data: rooms = [] } = useRooms()
  const { data: instances = [] } = useTodayInstances()

  // Find room for tasks
  const room = rooms.find((r) => r.ha_area_id === 'kuche' || r.id === roomId)
  const roomTasks = instances.filter(
    (i) => i.task.room_id === room?.id && i.status === 'pending'
  )

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <VacuumStatusBar
        status={vacuum.status}
        statusText={vacuum.statusText}
        battery={vacuum.battery}
        isCharging={vacuum.isCharging}
        fanSpeed={vacuum.fanSpeed}
        mopIntensity={vacuum.mopIntensity}
        className="animate-entrance"
      />

      {/* Main Grid - 4 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Column 1: Vacuum Preview */}
        <div className="space-y-4 xl:col-span-1">
          <Card entrance entranceDelay={1} className="p-0 overflow-hidden">
            <VacuumPreviewWidget
              status={vacuum.status}
              mapImageUrl={vacuum.mapImageUrl}
              mapAvailable={vacuum.mapAvailable}
              lastCleanArea={vacuum.lastCleanArea}
              lastCleanDuration={vacuum.lastCleanDuration}
              battery={vacuum.battery}
              onStart={vacuum.start}
              onPause={vacuum.pause}
              onStop={vacuum.stop}
              onReturnToBase={vacuum.returnToBase}
              onLocate={vacuum.locate}
            />
          </Card>
        </div>

        {/* Column 2: Controls + Cleaning Modes */}
        <div className="space-y-4 xl:col-span-1">
          {/* Controls */}
          <Card entrance entranceDelay={2}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-accent" />
                Steuerung
              </CardTitle>
            </CardHeader>
            <VacuumControlsWidget
              status={vacuum.status}
              onStart={vacuum.start}
              onPause={vacuum.pause}
              onStop={vacuum.stop}
              onReturnToBase={vacuum.returnToBase}
              onLocate={vacuum.locate}
            />
          </Card>

          {/* Cleaning Modes */}
          <Card entrance entranceDelay={3}>
            <CardHeader>
              <CardTitle>Reinigungsmodus</CardTitle>
            </CardHeader>
            <CleaningModesWidget
              fanSpeed={vacuum.fanSpeed}
              fanSpeedList={vacuum.fanSpeedList}
              mopIntensity={vacuum.mopIntensity}
              mopIntensityList={vacuum.mopIntensityList}
              onFanSpeedChange={vacuum.setFanSpeed}
              onMopIntensityChange={vacuum.setMopIntensity}
            />
          </Card>

          {/* Kitchen Light */}
          {lightEntityId && !kitchenLight.isUnavailable && (
            <Card entrance entranceDelay={4}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-warning" />
                  Beleuchtung
                </CardTitle>
              </CardHeader>
              <button
                onClick={kitchenLight.toggle}
                className={clsx(
                  'w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-300',
                  kitchenLight.isOn
                    ? 'bg-warning/20 border border-warning/30 border-glow-on'
                    : 'bg-surface-hover hover:bg-surface-hover/80'
                )}
              >
                {kitchenLight.isOn ? (
                  <Lightbulb className="w-8 h-8 text-warning icon-glow-warning" />
                ) : (
                  <LightbulbOff className="w-8 h-8 text-text-secondary" />
                )}
                <div className="flex-1 text-left">
                  <p className={clsx(
                    'font-medium',
                    kitchenLight.isOn && 'text-warning text-glow-warning'
                  )}>
                    Deckenlampe
                  </p>
                  <p className="text-sm text-text-secondary">
                    {kitchenLight.isOn ? 'Eingeschaltet' : 'Ausgeschaltet'}
                  </p>
                </div>
              </button>
            </Card>
          )}
        </div>

        {/* Column 3: Cleaning Stats */}
        <div className="space-y-4 xl:col-span-1">
          <Card entrance entranceDelay={5}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-neon-cyan" />
                Statistiken
              </CardTitle>
            </CardHeader>
            <CleaningStatsWidget
              lastCleanArea={vacuum.lastCleanArea}
              lastCleanDuration={vacuum.lastCleanDuration}
              lastCleanStart={vacuum.lastCleanStart}
              lastCleanEnd={vacuum.lastCleanEnd}
              totalCleanArea={vacuum.totalCleanArea}
              totalCleanCount={vacuum.totalCleanCount}
              totalCleanTime={vacuum.totalCleanTime}
            />
          </Card>

          {/* Media Player */}
          {mediaPlayerEntityId && (
            <Card entrance entranceDelay={6}>
              <CardHeader>
                <CardTitle>Musik</CardTitle>
              </CardHeader>
              <MediaWidget entityId={mediaPlayerEntityId} />
            </Card>
          )}
        </div>

        {/* Column 4: Consumables + Tasks */}
        <div className="space-y-4 xl:col-span-1">
          {/* Consumables */}
          <Card entrance entranceDelay={7}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-warning" />
                Verschleiß
              </CardTitle>
            </CardHeader>
            <ConsumablesWidget
              mainBrushLeft={vacuum.mainBrushLeft}
              sideBrushLeft={vacuum.sideBrushLeft}
              filterLeft={vacuum.filterLeft}
              sensorLeft={vacuum.sensorLeft}
            />
          </Card>

          {/* Tasks */}
          {roomTasks.length > 0 && (
            <Card entrance entranceDelay={8}>
              <CardHeader>
                <CardTitle>Aufgaben</CardTitle>
              </CardHeader>
              <div className="space-y-3">
                {roomTasks.map((instance) => (
                  <TaskWidget key={instance.id} instance={instance} />
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
