import { useMemo } from 'react'
import { clsx } from 'clsx'

interface SparklineChartProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  fillOpacity?: number
  strokeWidth?: number
  showDots?: boolean
  showArea?: boolean
  className?: string
  minY?: number
  maxY?: number
}

export function SparklineChart({
  data,
  width = 100,
  height = 40,
  color = 'rgb(from var(--color-accent) r g b)',
  fillOpacity = 0.2,
  strokeWidth = 1.5,
  showDots = false,
  showArea = true,
  className,
  minY,
  maxY,
}: SparklineChartProps) {
  const { path, areaPath, points } = useMemo(() => {
    if (data.length < 2) {
      return { path: '', areaPath: '', points: [] }
    }

    const padding = 2
    const effectiveWidth = width - padding * 2
    const effectiveHeight = height - padding * 2

    // Calculate bounds
    const dataMin = minY ?? Math.min(...data)
    const dataMax = maxY ?? Math.max(...data)
    const range = dataMax - dataMin || 1

    // Generate points
    const pts: { x: number; y: number }[] = data.map((value, index) => ({
      x: padding + (index / (data.length - 1)) * effectiveWidth,
      y: padding + effectiveHeight - ((value - dataMin) / range) * effectiveHeight,
    }))

    // Create smooth path using cardinal spline
    const tension = 0.3
    let pathD = `M ${pts[0].x} ${pts[0].y}`

    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)]
      const p1 = pts[i]
      const p2 = pts[i + 1]
      const p3 = pts[Math.min(pts.length - 1, i + 2)]

      const cp1x = p1.x + (p2.x - p0.x) * tension
      const cp1y = p1.y + (p2.y - p0.y) * tension
      const cp2x = p2.x - (p3.x - p1.x) * tension
      const cp2y = p2.y - (p3.y - p1.y) * tension

      pathD += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
    }

    // Create area path
    const areaD = `${pathD} L ${pts[pts.length - 1].x} ${height - padding} L ${pts[0].x} ${height - padding} Z`

    return { path: pathD, areaPath: areaD, points: pts }
  }, [data, width, height, minY, maxY])

  if (data.length < 2) {
    return (
      <div
        className={clsx('flex items-center justify-center text-text-secondary text-xs', className)}
        style={{ width, height }}
      >
        Keine Daten
      </div>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      className={className}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id={`sparkline-gradient-${color.replace(/[^a-z0-9]/gi, '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={fillOpacity} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#sparkline-gradient-${color.replace(/[^a-z0-9]/gi, '')})`}
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color})` }}
      />

      {/* Dots */}
      {showDots && points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={2}
          fill={color}
        />
      ))}

      {/* Last point highlight */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          fill={color}
          style={{ filter: `drop-shadow(0 0 4px ${color})` }}
        />
      )}
    </svg>
  )
}
