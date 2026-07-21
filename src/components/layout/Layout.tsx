import { type ReactNode } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { DaylightProvider } from '../../contexts/DaylightContext'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <DaylightProvider>
      {/* Der Mesh-Grund liegt fix hinter allem — ein einziges Element,
          damit der Blur der Panels nur eine Ebene zu verrechnen hat. */}
      <div className="mesh-bg" aria-hidden="true" />

      <div className="min-h-screen lg:p-6">
        {/*
          Ab lg: sitzt die ganze App als eine Glasplatte auf dem Mesh und
          scrollt innen. Mobil wäre eine Platte mit Innenabstand nur
          verschenkter Rand — dort sind die einzelnen Panels das Glas.
        */}
        <div className="lg:glass-plate lg:flex lg:overflow-hidden lg:h-[calc(100vh-3rem)]">
          <Sidebar />

          <div className="flex-1 min-w-0 flex flex-col lg:overflow-hidden">
            <div className="lg:hidden">
              <Header />
            </div>

            {/* Breitenbegrenzung: auf einem 4K-Küchendisplay würde der
                Inhalt sonst über die ganze Wand laufen. */}
            <main className="flex-1 lg:overflow-y-auto px-4 py-4 pb-24 lg:px-8 lg:py-7 lg:pb-8">
              <div className="w-full max-w-[1400px] mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </div>

      <BottomNav />
    </DaylightProvider>
  )
}
