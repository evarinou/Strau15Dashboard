import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  usersApi,
  roomsApi,
  tasksApi,
  instancesApi,
  leaderboardApi,
  achievementsApi,
  summariesApi,
} from '../api/chorequest'
import type { CompleteRequest, AssignRequest, TaskCreateRequest } from '../types/chorequest'

// Query Keys
export const queryKeys = {
  users: ['users'] as const,
  user: (id: number) => ['users', id] as const,
  userStats: (id: number) => ['users', id, 'stats'] as const,
  rooms: ['rooms'] as const,
  tasks: (params?: { room_id?: number }) => ['tasks', params] as const,
  instances: (params?: { room_id?: number; status?: string }) => ['instances', params] as const,
  todayInstances: ['instances', 'today'] as const,
  leaderboard: ['leaderboard'] as const,
  weeklyLeaderboard: ['leaderboard', 'weekly'] as const,
  achievements: ['achievements'] as const,
  userAchievements: (userId: number) => ['achievements', userId] as const,
  userProgress: (userId: number) => ['achievements', userId, 'progress'] as const,
  summaries: ['summaries'] as const,
  latestSummary: ['summaries', 'latest'] as const,
}

// Users
export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: usersApi.list,
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => usersApi.get(id),
    enabled: id > 0,
  })
}

export function useUserStats(id: number) {
  return useQuery({
    queryKey: queryKeys.userStats(id),
    queryFn: () => usersApi.getStats(id),
    enabled: id > 0,
  })
}

// Rooms
export function useRooms() {
  return useQuery({
    queryKey: queryKeys.rooms,
    queryFn: roomsApi.list,
  })
}

// Tasks
export function useTasks(params?: { room_id?: number }) {
  return useQuery({
    queryKey: queryKeys.tasks(params),
    queryFn: () => tasksApi.list(params),
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: TaskCreateRequest) => tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['instances'] })
    },
  })
}

// Task Instances
export function useInstances(params?: { room_id?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.instances(params),
    queryFn: () => instancesApi.list(params),
  })
}

export function useTodayInstances() {
  return useQuery({
    queryKey: queryKeys.todayInstances,
    queryFn: instancesApi.today,
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useCompleteInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CompleteRequest }) =>
      instancesApi.complete(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    },
  })
}

export function useSkipInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => instancesApi.skip(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
    },
  })
}

export function useAssignInstance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AssignRequest }) =>
      instancesApi.assign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] })
    },
  })
}

// Leaderboard
export function useLeaderboard() {
  return useQuery({
    queryKey: queryKeys.leaderboard,
    queryFn: leaderboardApi.get,
  })
}

export function useWeeklyLeaderboard() {
  return useQuery({
    queryKey: queryKeys.weeklyLeaderboard,
    queryFn: leaderboardApi.weekly,
  })
}

// Achievements
export function useAchievements() {
  return useQuery({
    queryKey: queryKeys.achievements,
    queryFn: achievementsApi.list,
  })
}

export function useUserAchievements(userId: number) {
  return useQuery({
    queryKey: queryKeys.userAchievements(userId),
    queryFn: () => achievementsApi.userAchievements(userId),
    enabled: userId > 0,
  })
}

export function useUserProgress(userId: number) {
  return useQuery({
    queryKey: queryKeys.userProgress(userId),
    queryFn: () => achievementsApi.userProgress(userId),
    enabled: userId > 0,
  })
}

// Summaries
export function useSummaries(limit = 10) {
  return useQuery({
    queryKey: queryKeys.summaries,
    queryFn: () => summariesApi.list(limit),
  })
}

export function useLatestSummary() {
  return useQuery({
    queryKey: queryKeys.latestSummary,
    queryFn: summariesApi.latest,
  })
}
