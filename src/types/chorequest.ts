export interface User {
  id: number
  username: string
  display_name: string | null
  avatar_url: string | null
  total_points: number
  weekly_points: number
  current_streak: number
  longest_streak: number
  ha_user_id: string | null
  created_at: string
}

export interface UserStats {
  user: User
  tasks_completed_total: number
  tasks_completed_this_week: number
  favorite_room: string | null
  achievements_count: number
}

export interface Room {
  id: number
  name: string
  icon: string
  point_multiplier: number
  sort_order: number
  ha_area_id: string | null
}

export interface Task {
  id: number
  title: string
  description: string | null
  room_id: number
  base_points: number
  estimated_minutes: number
  recurrence: string
  recurrence_day: number | null
  is_active: boolean
  created_at: string
}

export interface TaskInstance {
  id: number
  task_id: number
  due_date: string | null
  status: 'pending' | 'completed' | 'skipped'
  assigned_user_id: number | null
  created_at: string
  task: Task
  assigned_user?: User | null
}

export interface Achievement {
  id: number
  name: string
  description: string | null
  icon: string | null
  criteria: Record<string, unknown>
  points_reward: number
}

export interface UserAchievement {
  id: number
  user_id: number
  achievement_id: number
  unlocked_at: string
  achievement: Achievement
}

export interface AchievementProgress {
  achievement: Achievement
  unlocked: boolean
  unlocked_at: string | null
  current_value: number
  target_value: number
  progress_percent: number
}

export interface BonusBreakdown {
  base_points: number
  room_multiplier: number
  early_bonus: number
  streak_bonus: number
  room_completion_bonus: number
  total_points: number
  bonus_points: number
}

export interface StreakUpdate {
  current_streak: number
  longest_streak: number
  streak_bonus_active: boolean
}

export interface UnlockedAchievement {
  id: number
  name: string
  description: string | null
  icon: string | null
  points_reward: number
}

export interface CompletionResponse {
  completion: {
    id: number
    task_instance_id: number
    user_id: number
    completed_at: string
    points_earned: number
    bonus_points: number
    notes: string | null
  }
  bonus_breakdown: BonusBreakdown
  streak: StreakUpdate
  unlocked_achievements: UnlockedAchievement[]
}

export interface WeeklySummary {
  id: number
  week_start: string
  week_end: string
  summary_text: string | null
  suggested_tasks: SuggestedTask[] | null
  generated_at: string
}

export interface SuggestedTask {
  title: string
  description: string
  room_name: string
  estimated_minutes: number
  reason: string
}

// API Request Types
export interface TaskCreateRequest {
  title: string
  description?: string
  room_id: number
  base_points?: number
  estimated_minutes?: number
  recurrence?: string
  recurrence_day?: number
}

export interface CompleteRequest {
  user_id: number
  notes?: string
}

export interface AssignRequest {
  user_id: number
}
