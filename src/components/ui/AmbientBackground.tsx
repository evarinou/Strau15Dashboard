import { useMemo } from 'react'

interface Particle {
  id: number
  left: number
  top: number
  size: number
  duration: number
  delay: number
  opacity: number
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duration: 15 + Math.random() * 20,
    delay: Math.random() * 10,
    opacity: 0.1 + Math.random() * 0.2,
  }))
}

interface AmbientBackgroundProps {
  showParticles?: boolean
  particleCount?: number
}

export function AmbientBackground({
  showParticles = true,
  particleCount = 6,
}: AmbientBackgroundProps) {
  const particles = useMemo(() => generateParticles(particleCount), [particleCount])

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: -1 }}
      aria-hidden="true"
    >
      {/* Top-right cyan gradient orb */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.85 0.18 195 / 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Bottom-left magenta gradient orb */}
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.70 0.25 330 / 0.06) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Center accent glow (very subtle) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, oklch(0.623 0.214 259.13 / 0.03) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
      />

      {/* Floating particles */}
      {showParticles &&
        particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              width: particle.size,
              height: particle.size,
              background: `oklch(0.85 0.18 195 / ${particle.opacity})`,
              boxShadow: `0 0 ${particle.size * 2}px oklch(0.85 0.18 195 / ${particle.opacity})`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}

      {/* Subtle scan line effect (optional - disabled by default for performance) */}
      {/* Uncomment if desired:
      <div
        className="absolute inset-0"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(1 0 0 / 0.01) 2px, oklch(1 0 0 / 0.01) 4px)',
          pointerEvents: 'none',
        }}
      />
      */}
    </div>
  )
}
