import { useEffect, useState } from 'react'
import { Trophy, TrendingUp, Flame } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useWeeklyLeaderboard } from '../../hooks/useChoreQuest'
import { useCurrentUser } from '../../contexts/UserContext'

// Animated counter hook
function useAnimatedCounter(target: number, duration: number = 1000) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (target === 0) {
      setCount(0)
      return
    }

    const startTime = Date.now()
    const startValue = 0

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(startValue + (target - startValue) * eased)

      setCount(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [target, duration])

  return count
}

interface LeaderboardWidgetProps {
  entrance?: boolean
  entranceDelay?: number
  compact?: boolean
}

export function LeaderboardWidget({
  entrance = false,
  entranceDelay = 0,
  compact = false,
}: LeaderboardWidgetProps) {
  const { data: leaderboard = [], isLoading } = useWeeklyLeaderboard()
  const { currentUser } = useCurrentUser()

  if (isLoading) {
    return (
      <Card entrance={entrance} entranceDelay={entranceDelay} className={compact ? '!p-3' : ''}>
        {!compact && (
          <CardHeader>
            <CardTitle>Wochenrangliste</CardTitle>
          </CardHeader>
        )}
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className={clsx('bg-white/35 rounded-2xl animate-shimmer', compact ? 'h-8' : 'h-12')}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </Card>
    )
  }

  // Compact mode: show only leader or current user's ranking
  if (compact) {
    const leader = leaderboard[0]
    if (!leader) return null

    return (
      <Card entrance={entrance} entranceDelay={entranceDelay} className="!p-3">
        <div className="flex items-center gap-3">
          <div className="glass-inset w-10 h-10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {leader.display_name?.split(' ')[0] || leader.username}
            </p>
            <p className="text-xs text-text-secondary flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span className="text-warning font-medium">{leader.weekly_points}</span> Punkte
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card entrance={entrance} entranceDelay={entranceDelay}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-warning" />
          Wochenrangliste
        </CardTitle>
      </CardHeader>

      <div className="space-y-2">
        {leaderboard.map((user, index) => {
          const isCurrentUser = user.id === currentUser?.id
          const isLeader = index === 0

          return (
            <LeaderboardRow
              key={user.id}
              rank={index + 1}
              name={user.display_name || user.username}
              points={user.weekly_points}
              streak={user.current_streak}
              isLeader={isLeader}
              isCurrentUser={isCurrentUser}
            />
          )
        })}
      </div>
    </Card>
  )
}

interface LeaderboardRowProps {
  rank: number
  name: string
  points: number
  streak: number
  isLeader: boolean
  isCurrentUser: boolean
}

function LeaderboardRow({
  rank,
  name,
  points,
  streak,
  isLeader,
  isCurrentUser,
}: LeaderboardRowProps) {
  const animatedPoints = useAnimatedCounter(points, 1500)

  return (
    <div
      className={clsx(
        'flex items-center gap-3 p-2.5 rounded-2xl transition-all duration-300',
        isCurrentUser && 'glass-inset ring-1 ring-accent/35',
        isLeader && !isCurrentUser && 'glass-inset'
      )}
    >
      {/* Rank badge */}
      <div
        className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
          isLeader ? 'bg-warning-fill text-ink' : 'bg-white/45 text-text-secondary'
        )}
      >
        {isLeader ? <Trophy className="w-4 h-4" /> : rank}
      </div>

      {/* Name & stats */}
      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-sm font-medium truncate transition-all duration-300',
            isCurrentUser ? 'text-accent' : 'text-text-primary'
          )}
        >
          {name}
        </p>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span
              className={clsx(
                'tabular-nums font-medium',
                isLeader && 'text-warning'
              )}
            >
              {animatedPoints}
            </span>
            <span className="text-text-secondary/70">Punkte</span>
          </span>
          {streak > 0 && (
            <span
              className={clsx(
                'flex items-center gap-1',
                streak >= 7 ? 'text-danger' : 'text-warning'
              )}
            >
              <Flame className={clsx('w-3 h-3', streak >= 3 && 'animate-float')} />
              <span className="font-medium">{streak}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
