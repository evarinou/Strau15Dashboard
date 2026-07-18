import type {
  User,
  UserStats,
  Room,
  Task,
  TaskInstance,
  Achievement,
  UserAchievement,
  AchievementProgress,
  CompletionResponse,
  WeeklySummary,
  TaskCreateRequest,
  CompleteRequest,
  AssignRequest,
} from '../types/chorequest'

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Endpunkte sind als '/api/...' notiert; der BFF-Proxy mappt
  // /api/chorequest/* auf ${CHOREQUEST_URL}/api/* und hängt den
  // Bearer-Token serverseitig an — der Browser sieht keine Tokens mehr.
  const response = await fetch(`/api/chorequest${endpoint.replace(/^\/api/, '')}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API Error: ${response.status} - ${error}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// Users
export const usersApi = {
  list: () => fetchApi<User[]>('/api/users'),
  get: (id: number) => fetchApi<User>(`/api/users/${id}`),
  getStats: (id: number) => fetchApi<UserStats>(`/api/users/${id}/stats`),
}

// Rooms
export const roomsApi = {
  list: () => fetchApi<Room[]>('/api/rooms'),
}

// Tasks
export const tasksApi = {
  list: (params?: { room_id?: number; is_active?: boolean }) => {
    const searchParams = new URLSearchParams()
    if (params?.room_id) searchParams.set('room_id', String(params.room_id))
    if (params?.is_active !== undefined) searchParams.set('is_active', String(params.is_active))
    const query = searchParams.toString()
    return fetchApi<Task[]>(`/api/tasks${query ? `?${query}` : ''}`)
  },
  get: (id: number) => fetchApi<Task>(`/api/tasks/${id}`),
  create: (data: TaskCreateRequest) =>
    fetchApi<Task>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  delete: (id: number) =>
    fetchApi<void>(`/api/tasks/${id}`, { method: 'DELETE' }),
}

// Task Instances
export const instancesApi = {
  list: (params?: { room_id?: number; user_id?: number; status?: string; due_date?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.room_id) searchParams.set('room_id', String(params.room_id))
    if (params?.user_id) searchParams.set('user_id', String(params.user_id))
    if (params?.status) searchParams.set('status', params.status)
    if (params?.due_date) searchParams.set('due_date', params.due_date)
    const query = searchParams.toString()
    return fetchApi<TaskInstance[]>(`/api/instances${query ? `?${query}` : ''}`)
  },
  today: () => fetchApi<TaskInstance[]>('/api/instances/today'),
  complete: (id: number, data: CompleteRequest) =>
    fetchApi<CompletionResponse>(`/api/instances/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  skip: (id: number) =>
    fetchApi<void>(`/api/instances/${id}/skip`, { method: 'POST' }),
  assign: (id: number, data: AssignRequest) =>
    fetchApi<TaskInstance>(`/api/instances/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// Gamification
export const leaderboardApi = {
  get: () => fetchApi<User[]>('/api/leaderboard'),
  weekly: () => fetchApi<User[]>('/api/leaderboard/weekly'),
}

export const achievementsApi = {
  list: () => fetchApi<Achievement[]>('/api/achievements'),
  userAchievements: (userId: number) =>
    fetchApi<UserAchievement[]>(`/api/achievements/${userId}`),
  userProgress: (userId: number) =>
    fetchApi<AchievementProgress[]>(`/api/achievements/${userId}/progress`),
}

// Summaries
export const summariesApi = {
  list: (limit = 10) => fetchApi<WeeklySummary[]>(`/api/summaries?limit=${limit}`),
  latest: () => fetchApi<WeeklySummary>('/api/summaries/latest'),
}

// Dashboard
export const dashboardApi = {
  get: () => fetchApi<unknown>('/api/dashboard'),
}
