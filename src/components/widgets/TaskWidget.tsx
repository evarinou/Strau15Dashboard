import { useState, useMemo } from 'react'
import { Check, Clock, User, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useCurrentUser } from '../../contexts/UserContext'
import { useCompleteInstance } from '../../hooks/useChoreQuest'
import type { TaskInstance, CompletionResponse } from '../../types/chorequest'

interface TaskWidgetProps {
  instance: TaskInstance
  onComplete?: (response: CompletionResponse) => void
  entrance?: boolean
  entranceDelay?: number
  compact?: boolean
}

// Generate random confetti particles
function generateConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1,
    color: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
    size: 4 + Math.random() * 4,
  }))
}

export function TaskWidget({
  instance,
  onComplete,
  entrance = false,
  entranceDelay = 0,
  compact = false,
}: TaskWidgetProps) {
  const { currentUser } = useCurrentUser()
  const completeTask = useCompleteInstance()
  const [showSuccess, setShowSuccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const confettiParticles = useMemo(() => generateConfetti(15), [])

  const handleComplete = async () => {
    if (!currentUser || instance.status !== 'pending') return

    try {
      const response = await completeTask.mutateAsync({
        id: instance.id,
        data: { user_id: currentUser.id },
      })
      setShowSuccess(true)
      setShowConfetti(true)
      onComplete?.(response)

      setTimeout(() => setShowConfetti(false), 2000)
      setTimeout(() => setShowSuccess(false), 2500)
    } catch (error) {
      console.error('Failed to complete task:', error)
    }
  }

  const isCompleted = instance.status === 'completed' || showSuccess
  const isPending = instance.status === 'pending' && !showSuccess

  return (
    <Card
      entrance={entrance}
      entranceDelay={entranceDelay}
      glowOnActive={isCompleted}
      glowColor="success"
      className={clsx(
        'relative overflow-hidden transition-all duration-300',
        showSuccess && 'animate-glow-burst'
      )}
    >
      {/* Confetti overlay */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confettiParticles.map((particle) => (
            <div
              key={particle.id}
              className="absolute"
              style={{
                left: `${particle.left}%`,
                top: '-10px',
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: '50%',
                animation: `confetti-fall ${particle.duration}s ease-out ${particle.delay}s forwards`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Animated Checkbox */}
        <button
          onClick={handleComplete}
          disabled={!isPending || completeTask.isPending}
          className={clsx(
            'relative w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
            'transition-all duration-300',
            isCompleted
              ? 'bg-success border-success text-white'
              : 'border-border hover:border-accent hover:bg-accent/10',
            showSuccess && 'animate-scale-bounce'
          )}
          style={{
            boxShadow: isCompleted
              ? '0 0 12px oklch(0.627 0.194 149.21 / 0.5)'
              : 'none',
          }}
        >
          {isCompleted && <Check className="w-4 h-4 icon-glow-success" />}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className={clsx(
              'text-sm font-medium transition-all duration-300',
              isCompleted && 'line-through text-text-secondary'
            )}
          >
            {instance.task.title}
          </p>

          {!compact && instance.task.description && (
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
              {instance.task.description}
            </p>
          )}

          <div className={clsx('flex items-center gap-3 text-xs text-text-secondary', compact ? 'mt-1' : 'mt-2')}>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {instance.task.estimated_minutes} Min.
            </span>
            {/* Points badge with shimmer on success */}
            <span
              className={clsx(
                'relative flex items-center gap-1 px-1.5 py-0.5 rounded-full',
                isCompleted
                  ? 'bg-success/20 text-success'
                  : 'bg-accent/10 text-accent'
              )}
            >
              <Sparkles className={clsx('w-3 h-3', isCompleted && 'icon-glow-success')} />
              <span className={clsx(showSuccess && 'animate-count-pulse font-bold')}>
                {instance.task.base_points}
              </span>
              {/* Shimmer effect */}
              {showSuccess && (
                <span className="absolute inset-0 rounded-full animate-shimmer" />
              )}
            </span>
            {!compact && instance.assigned_user && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {instance.assigned_user.display_name || instance.assigned_user.username}
              </span>
            )}
          </div>
        </div>

        {/* Quick complete button */}
        {isPending && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleComplete}
            disabled={completeTask.isPending}
            className="flex-shrink-0 hover:text-success hover:bg-success/10"
          >
            Erledigt
          </Button>
        )}
      </div>
    </Card>
  )
}
