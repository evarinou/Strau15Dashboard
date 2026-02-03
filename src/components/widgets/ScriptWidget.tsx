import { useState } from 'react'
import { Play, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Card } from '../ui/Card'
import { useScript } from '../../contexts/HomeAssistantContext'

interface ScriptWidgetProps {
  entityId: string
  icon?: React.ReactNode
}

export function ScriptWidget({ entityId, icon }: ScriptWidgetProps) {
  const { isRunning, friendlyName, run } = useScript(entityId)
  const [isExecuting, setIsExecuting] = useState(false)

  const handleClick = async () => {
    if (isRunning || isExecuting) return
    setIsExecuting(true)
    try {
      await run()
    } finally {
      setTimeout(() => setIsExecuting(false), 1000)
    }
  }

  const showLoading = isRunning || isExecuting

  return (
    <Card
      variant="interactive"
      className={clsx(
        'cursor-pointer select-none',
        showLoading && 'ring-2 ring-accent'
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
            showLoading ? 'bg-accent/20 text-accent' : 'bg-surface-hover text-text-secondary'
          )}
        >
          {showLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : icon ? (
            icon
          ) : (
            <Play className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{friendlyName || entityId}</p>
          <p className="text-xs text-text-secondary">
            {showLoading ? 'Wird ausgeführt...' : 'Script'}
          </p>
        </div>
      </div>
    </Card>
  )
}
