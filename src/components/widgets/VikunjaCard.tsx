import { ListTodo } from 'lucide-react'
import { clsx } from 'clsx'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useVikunjaTasks } from '../../hooks/useBff'

// Offene Aufgaben aus dem Vikunja-Projekt „Strau15" (read-only Liste).
export function VikunjaCard() {
  const { data } = useVikunjaTasks()

  if (!data) return null

  const tasks = data.tasks.slice(0, 6)

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Projekt Strau15</CardTitle>
        {data.tasks.length > 0 && (
          <span className="text-xs bg-accent/10 text-accent-soft px-2 py-0.5 rounded-full">
            {data.tasks.length} offen
          </span>
        )}
      </CardHeader>
      {tasks.length === 0 ? (
        <p className="text-sm text-text-secondary">Nichts offen — gut gemacht.</p>
      ) : (
        <ul className="space-y-2.5">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3 min-w-0">
              <ListTodo
                className={clsx(
                  'w-4 h-4 flex-shrink-0',
                  task.overdue ? 'text-danger' : 'text-text-secondary'
                )}
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{task.title}</p>
                {task.due_date && (
                  <p className={clsx('text-xs', task.overdue ? 'text-danger' : 'text-text-secondary')}>
                    {task.overdue ? 'überfällig seit ' : 'fällig '}
                    {new Date(task.due_date).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
