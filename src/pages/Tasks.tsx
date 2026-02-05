import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TaskWidget, LeaderboardWidget } from '../components/widgets'
import { useTodayInstances, useRooms, useUserProgress, useCreateTask } from '../hooks/useChoreQuest'
import { useCurrentUser } from '../contexts/UserContext'
import { mdiToEmoji } from '../utils/mdiToEmoji'
import type { CompletionResponse, TaskCreateRequest } from '../types/chorequest'

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

function CreateTaskModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { data: rooms = [] } = useRooms()
  const createTask = useCreateTask()
  const [title, setTitle] = useState('')
  const [roomId, setRoomId] = useState<number | ''>('')
  const [basePoints, setBasePoints] = useState(10)
  const [estimatedMinutes, setEstimatedMinutes] = useState<number | ''>('')
  const [recurrence, setRecurrence] = useState('once')

  if (!isOpen) return null

  const canSubmit = title.trim() !== '' && roomId !== '' && !createTask.isPending

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return

    const data: TaskCreateRequest = {
      title: title.trim(),
      room_id: roomId as number,
      base_points: basePoints,
      recurrence,
    }
    if (estimatedMinutes !== '') {
      data.estimated_minutes = estimatedMinutes
    }

    createTask.mutate(data, {
      onSuccess: () => {
        setTitle('')
        setRoomId('')
        setBasePoints(10)
        setEstimatedMinutes('')
        setRecurrence('once')
        onClose()
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-md p-6 rounded-2xl bg-surface-elevated border border-border/50 shadow-float-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Neue Aufgabe</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-hover transition-colors">
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Titel *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Küche wischen"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border/30 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
              autoFocus
            />
          </div>

          {/* Room */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Raum *
            </label>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border/30 text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="">Raum wählen...</option>
              {rooms
                .filter((r) => r.ha_area_id !== 'wecker')
                .map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
            </select>
          </div>

          {/* Points */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Punkte *
            </label>
            <input
              type="number"
              value={basePoints}
              onChange={(e) => setBasePoints(Number(e.target.value))}
              min={1}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border/30 text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Estimated Minutes */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Geschätzte Minuten
            </label>
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value ? Number(e.target.value) : '')}
              min={1}
              placeholder="Optional"
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border/30 text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>

          {/* Recurrence */}
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Wiederholung
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border/30 text-text-primary focus:outline-none focus:border-accent/50 transition-colors"
            >
              <option value="once">Einmalig</option>
              <option value="daily">Täglich</option>
              <option value="weekly">Wöchentlich</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={!canSubmit}>
              {createTask.isPending ? 'Erstelle...' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function Tasks() {
  const { currentUser } = useCurrentUser()
  const { data: instances = [], isLoading } = useTodayInstances()
  const { data: progress = [] } = useUserProgress(currentUser?.id || 0)
  const [celebration, setCelebration] = useState<CompletionResponse | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const pendingInstances = instances.filter((i) => i.status === 'pending')
  const completedInstances = instances.filter((i) => i.status === 'completed')

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

      <CreateTaskModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aufgaben</h1>
          <p className="text-text-secondary">
            {pendingInstances.length} offen, {completedInstances.length} erledigt
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Aufgabe
        </Button>
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
