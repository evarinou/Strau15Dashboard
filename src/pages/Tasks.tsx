import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TaskWidget, LeaderboardWidget } from '../components/widgets'
import { useTodayInstances, useRooms, useUserProgress } from '../hooks/useChoreQuest'
import { useCurrentUser } from '../contexts/UserContext'
import { mdiToEmoji } from '../utils/mdiToEmoji'
import type { CompletionResponse } from '../types/chorequest'

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
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={selectedRoom === null ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setSelectedRoom(null)}
        >
          Alle
        </Button>
        {rooms
          .filter((r) => r.ha_area_id !== 'wecker')
          .map((room) => (
            <Button
              key={room.id}
              variant={selectedRoom === room.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedRoom(room.id)}
            >
              {room.name}
            </Button>
          ))}
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
