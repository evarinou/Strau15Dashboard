import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { useUsers } from '../hooks/useChoreQuest'
import type { User } from '../types/chorequest'

interface UserContextValue {
  currentUser: User | null
  users: User[]
  setCurrentUser: (user: User) => void
  isLoading: boolean
}

const UserContext = createContext<UserContextValue | null>(null)

const USER_STORAGE_KEY = 'strau15-current-user'

interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const { data: users = [], isLoading } = useUsers()
  const [currentUser, setCurrentUserState] = useState<User | null>(null)

  // Load saved user from localStorage
  useEffect(() => {
    const savedUserId = localStorage.getItem(USER_STORAGE_KEY)
    if (savedUserId && users.length > 0) {
      const user = users.find((u) => u.id === Number(savedUserId))
      if (user) {
        setCurrentUserState(user)
      }
    }
  }, [users])

  // Auto-select first user if none selected
  useEffect(() => {
    if (!currentUser && users.length > 0 && !isLoading) {
      setCurrentUserState(users[0])
    }
  }, [users, currentUser, isLoading])

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user)
    localStorage.setItem(USER_STORAGE_KEY, String(user.id))
  }

  return (
    <UserContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useCurrentUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useCurrentUser must be used within a UserProvider')
  }
  return context
}
