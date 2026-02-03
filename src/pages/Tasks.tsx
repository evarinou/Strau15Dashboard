import { useState } from 'react'
import {
  Plus,
  Home,
  Sofa,
  UtensilsCrossed,
  Bed,
  Bath,
  BookOpen,
  Hammer,
  Sun,
  Printer,
  DoorOpen,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TaskWidget, LeaderboardWidget } from '../components/widgets'
import { useTodayInstances, useRooms, useUserProgress } from '../hooks/useChoreQuest'
import { useCurrentUser } from '../contexts/UserContext'
import { mdiToEmoji } from '../utils/mdiToEmoji'
import type { CompletionResponse } from '../types/chorequest'

const roomIcons: Record<string, typeof Sofa> = {
  wohnzimmer: Sofa,
  kuche: UtensilsCrossed,
  schlafzimmer: Bed,
  bad: Bath,
  bucherzimmer: BookOpen,
  werkstatt: Hammer,
  innenhof: Sun,
  '3d_drucker_zimmer': Printer,
  ankleide: DoorOpen,
  lukas_buro: DoorOpen,
  esszimmer: UtensilsCrossed,
}

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const percent = Math.min((value / max) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-secondary">
          {value}/{max}
        </span>
      </div>
      <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export function Tasks() {
  const { currentUser } = useCurrentUser()
  const { data: instances = [], isLoading } = useTodayInstances()
  const { data: rooms = [] } = useRooms()
  const { data: progress = [] } = useUserProgress(currentUser?.id || 0)
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null)
  const [celebration, setCelebration] = useState<CompletionResponse | null>(null)

  const filteredInstances = selectedRoom
    ? instances.filter((i) => i.task.room_id === selectedRoom)
    : instances

  const pendingInstances = filteredInstances.filter((i) => i.status === 'pending')
  const completedInstances = filteredInstances.filter((i) => i.status === 'completed')

  // Achievement progress (show top 3 not yet unlocked)
  const inProgressAchievements = progress
    .filter((p) => !p.unlocked && p.progress_percent > 0)
    .sort((a, b) => b.progress_percent - a.progress_percent)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      {celebration && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setCelebration(null)}
        >
          <div className="bg-surface-elevated rounded-2xl p-6 max-w-sm mx-4 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">+{celebration.bonus_breakdown.total_points} Punkte!</h2>
            {celebration.unlocked_achievements.length > 0 && (
              <div className="mt-4">
                <p className="text-warning">Achievement freigeschaltet!</p>
                <p>{celebration.unlocked_achievements[0].name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aufgaben</h1>
          <p className="text-text-secondary">
            {pendingInstances.length} offen, {completedInstances.length} erledigt
          </p>
        </div>
        <Button variant="primary">
          <Plus className="w-4 h-4 mr-2" />
          Neue Aufgabe
        </Button>
      </div>

      {/* Room Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        <button
          onClick={() => setSelectedRoom(null)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200',
            'border min-w-fit touch-target',
            selectedRoom === null
              ? 'bg-accent/15 border-accent/50 text-accent'
              : 'bg-surface-elevated border-border/30 text-text-secondary hover:bg-surface-hover hover:border-border/50'
          )}
        >
          <Home className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">Alle</span>
        </button>
        {rooms
          .filter((r) => r.ha_area_id !== 'wecker')
          .map((room) => {
            const Icon = roomIcons[room.ha_area_id || ''] || DoorOpen
            return (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-200',
                  'border min-w-fit touch-target',
                  selectedRoom === room.id
                    ? 'bg-accent/15 border-accent/50 text-accent'
                    : 'bg-surface-elevated border-border/30 text-text-secondary hover:bg-surface-hover hover:border-border/50'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">{room.name}</span>
              </button>
            )
          })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tasks */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending */}
          <Card>
            <CardHeader>
              <CardTitle>Offen ({pendingInstances.length})</CardTitle>
            </CardHeader>

            {isLoading ? (
              <div className="animate-pulse space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-surface-hover rounded-lg" />
                ))}
              </div>
            ) : pendingInstances.length === 0 ? (
              <div className="text-center py-8 text-text-secondary">
                <p className="text-4xl mb-2">✨</p>
                <p>Keine offenen Aufgaben!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingInstances.map((instance) => (
                  <TaskWidget
                    key={instance.id}
                    instance={instance}
                    onComplete={setCelebration}
                  />
                ))}
              </div>
            )}
          </Card>

          {/* Completed */}
          {completedInstances.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Erledigt ({completedInstances.length})</CardTitle>
              </CardHeader>
              <div className="space-y-3 opacity-60">
                {completedInstances.map((instance) => (
                  <TaskWidget key={instance.id} instance={instance} />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <LeaderboardWidget />

          {/* Achievement Progress */}
          {inProgressAchievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Achievement Fortschritt</CardTitle>
              </CardHeader>
              <div className="space-y-4">
                {inProgressAchievements.map((p) => (
                  <div key={p.achievement.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{mdiToEmoji(p.achievement.icon)}</span>
                      <span className="text-sm font-medium">{p.achievement.name}</span>
                    </div>
                    <ProgressBar
                      value={p.current_value}
                      max={p.target_value}
                      label={p.achievement.description || ''}
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
