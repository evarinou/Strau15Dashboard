import { createContext, useContext, type ReactNode } from 'react'
import { useDaylight, type DaylightPhase } from '../lib/daylight'

const DaylightContext = createContext<DaylightPhase>('tag')

/**
 * Die Tagphase wird genau einmal berechnet (und an <html> geschrieben);
 * Kacheln lesen sie hier ab, statt jede für sich einen Timer zu starten.
 */
export function DaylightProvider({ children }: { children: ReactNode }) {
  const phase = useDaylight()
  return <DaylightContext.Provider value={phase}>{children}</DaylightContext.Provider>
}

export function useDaylightPhase(): DaylightPhase {
  return useContext(DaylightContext)
}
