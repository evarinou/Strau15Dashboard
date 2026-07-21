import { Lightbulb, LightbulbOff, Flame, Square, Settings } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { PrinterStatusBar } from './PrinterStatusBar'
import { AMSWidget } from './AMSWidget'
import { FanControlPanel } from './FanControlWidget'
import { TemperatureControlWidget } from './TemperatureControlWidget'
import { PrintDetailsWidget, type PrintDetails } from './PrintDetailsWidget'
import { PrintPreviewWidget } from './PrintPreviewWidget'
import { TaskWidget } from './TaskWidget'
import { usePrinter } from '../../contexts/HomeAssistantContext'
import { useTodayInstances, useRooms } from '../../hooks/useChoreQuest'

interface PrinterDashboardProps {
  entityPrefix?: string
  roomId?: number
}

export function PrinterDashboard({
  entityPrefix = 'a1_03919d4b2001225',
  roomId,
}: PrinterDashboardProps) {
  const printer = usePrinter(entityPrefix)
  const { data: rooms = [] } = useRooms()
  const { data: instances = [] } = useTodayInstances()

  // Find room for tasks
  const room = rooms.find((r) => r.ha_area_id === '3d_drucker_zimmer' || r.id === roomId)
  const roomTasks = instances.filter(
    (i) => i.task.room_id === room?.id && i.status === 'pending'
  )

  const isPrinting = printer.status === 'printing'
  const isPaused = printer.status === 'paused'

  // Build print details for the details widget
  const printDetails: PrintDetails = {
    taskName: printer.jobName,
    progress: printer.printProgress,
    currentLayer: printer.currentLayer,
    totalLayers: printer.totalLayers,
    status: printer.statusText,
    statusType: printer.status,
    hmsNotifications: printer.hmsNotifications,
    startTime: printer.startTime,
    endTime: printer.endTime,
    remainingTime: printer.remainingTime,
    activeTray: printer.activeTray,
    activeTrayColor: printer.activeTrayColor,
    firmwareVersion: printer.firmwareVersion,
    printSpeed: printer.printSpeed,
    printStage: printer.printStage,
  }

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <PrinterStatusBar
        status={printer.status}
        statusText={printer.statusText}
        isOnline={printer.isAvailable}
        nozzleTemp={printer.nozzleTemp}
        bedTemp={printer.bedTemp}
        chamberTemp={printer.chamberTemp}
        className="animate-entrance"
      />

      {/* Main Grid - 4 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Column 1: Printer Preview + AMS */}
        <div className="space-y-4 xl:col-span-1">
          {/* Printer Preview with Camera */}
          <Card entrance entranceDelay={1} className="p-0 overflow-hidden">
            <PrintPreviewWidget
              cameraUrl={printer.cameraUrl}
              cameraAvailable={printer.cameraAvailable}
              isPrinting={isPrinting}
              isPaused={isPaused}
              progress={printer.printProgress}
              currentLayer={printer.currentLayer}
              totalLayers={printer.totalLayers}
              remainingTime={printer.remainingTime}
              printSpeed={printer.printSpeed}
              chamberLightOn={printer.chamberLightOn}
              onToggleChamberLight={printer.toggleChamberLight}
              onPause={printer.pausePrint}
              onResume={printer.resumePrint}
              onStop={printer.stopPrint}
              speedMode={printer.speedMode}
              onSpeedModeChange={(mode) => printer.setSpeedMode(mode as 'silent' | 'standard' | 'sport' | 'ludicrous')}
            />
          </Card>

          {/* AMS Widget */}
          {printer.amsUnits.length > 0 && (
            <Card entrance entranceDelay={2}>
              <CardHeader>
                <CardTitle>AMS</CardTitle>
              </CardHeader>
              <AMSWidget units={printer.amsUnits} compact />
            </Card>
          )}
        </div>

        {/* Column 2: Controls (Fans, Temperatures) */}
        <div className="space-y-4 xl:col-span-1">
          {/* Chamber Light Toggle */}
          <Card entrance entranceDelay={3}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Beleuchtung
              </CardTitle>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3">
              {/* Chamber light */}
              {printer.chamberLightEntity && (
                <button
                  onClick={printer.toggleChamberLight}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300',
                    printer.chamberLightOn
                      ? 'bg-warning/20 border border-warning/30'
                      : 'bg-surface-hover hover:bg-surface-hover/80'
                  )}
                >
                  {printer.chamberLightOn ? (
                    <Lightbulb className="w-6 h-6 text-warning" />
                  ) : (
                    <LightbulbOff className="w-6 h-6 text-text-secondary" />
                  )}
                  <span className={clsx(
                    'text-sm font-medium',
                    printer.chamberLightOn && 'text-warning'
                  )}>
                    Kammer
                  </span>
                </button>
              )}

              {/* Room light */}
              {printer.roomLightEntity && (
                <button
                  onClick={printer.toggleRoomLight}
                  className={clsx(
                    'flex flex-col items-center gap-2 p-4 rounded-xl transition-all duration-300',
                    printer.roomLightOn
                      ? 'bg-warning/20 border border-warning/30'
                      : 'bg-surface-hover hover:bg-surface-hover/80'
                  )}
                >
                  {printer.roomLightOn ? (
                    <Lightbulb className="w-6 h-6 text-warning" />
                  ) : (
                    <LightbulbOff className="w-6 h-6 text-text-secondary" />
                  )}
                  <span className={clsx(
                    'text-sm font-medium',
                    printer.roomLightOn && 'text-warning'
                  )}>
                    Raum
                  </span>
                </button>
              )}
            </div>
          </Card>

          {/* Fan Controls */}
          {printer.fans.length > 0 && (
            <Card entrance entranceDelay={4}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-accent" />
                  Lüfter
                </CardTitle>
              </CardHeader>
              <FanControlPanel
                fans={printer.fans}
                onFanSpeedChange={(fanId, speed) => printer.setFanSpeed(fanId, speed)}
              />
            </Card>
          )}

          {/* Temperature Controls */}
          <Card entrance entranceDelay={5}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-warning" />
                Temperaturen
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <TemperatureControlWidget
                label="Düsentemperatur"
                type="nozzle"
                currentTemp={printer.nozzleTemp}
                targetTemp={printer.nozzleTargetTemp}
                canControl={false}
                onTargetChange={printer.setNozzleTemp}
              />
              <TemperatureControlWidget
                label="Druckbetttemperatur"
                type="bed"
                currentTemp={printer.bedTemp}
                targetTemp={printer.bedTargetTemp}
                canControl={false}
                onTargetChange={printer.setBedTemp}
              />
              {printer.chamberTemp !== null && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-surface-elevated/30">
                  <div className="flex items-center gap-2">
                    <Square className="w-5 h-5 text-success" />
                    <span className="text-sm">Kammer</span>
                  </div>
                  <span className="text-sm font-bold text-success">
                    {Math.round(printer.chamberTemp)}°C
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Column 3: Print Details */}
        <div className="space-y-4 xl:col-span-1">
          <Card entrance entranceDelay={6}>
            <CardHeader>
              <CardTitle>Druckdetails</CardTitle>
            </CardHeader>
            <PrintDetailsWidget details={printDetails} />
          </Card>
        </div>

        {/* Column 4: AMS Details (on larger screens) or Tasks */}
        <div className="space-y-4 xl:col-span-1">
          {/* AMS Details (full version for desktop) */}
          {printer.amsUnits.length > 0 && (
            <div className="hidden xl:block">
              <Card entrance entranceDelay={7}>
                <CardHeader>
                  <CardTitle>AMS Details</CardTitle>
                </CardHeader>
                <AMSWidget units={printer.amsUnits} compact={false} />
              </Card>
            </div>
          )}

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
