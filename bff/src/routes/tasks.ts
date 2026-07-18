// /api/tasks — offene Vikunja-Tasks aus dem Projekt „Strau15".
// Projekt-ID wird beim ersten Zugriff aufgelöst und gecacht.

import type { FastifyInstance } from 'fastify'
import { config } from '../config.js'

export interface VikunjaTask {
  id: number
  title: string
  due_date: string | null
  overdue: boolean
  priority: number
}

let projectIdCache: number | null = null

function vikunjaEnabled(): boolean {
  return Boolean(config.vikunjaUrl && config.vikunjaToken)
}

function headers(): Record<string, string> {
  return { Authorization: `Bearer ${config.vikunjaToken}` }
}

async function resolveProjectId(): Promise<number> {
  if (projectIdCache !== null) return projectIdCache

  const response = await fetch(`${config.vikunjaUrl}/api/v1/projects`, {
    headers: headers(),
    signal: AbortSignal.timeout(10_000),
  })
  if (!response.ok) throw new Error(`Vikunja-Projekte: ${response.status}`)

  const projects = (await response.json()) as { id: number; title: string }[]
  const project = projects.find(
    (p) => p.title.toLowerCase() === config.vikunjaProject.toLowerCase()
  )
  if (!project) throw new Error(`Vikunja-Projekt "${config.vikunjaProject}" nicht gefunden`)

  projectIdCache = project.id
  return project.id
}

const NO_DUE_DATE = '0001-01-01T00:00:00Z'

export async function fetchVikunjaTasks(): Promise<VikunjaTask[]> {
  if (!vikunjaEnabled()) throw new Error('Vikunja nicht konfiguriert')

  const projectId = await resolveProjectId()
  const response = await fetch(
    `${config.vikunjaUrl}/api/v1/projects/${projectId}/tasks?per_page=50`,
    { headers: headers(), signal: AbortSignal.timeout(10_000) }
  )
  if (!response.ok) {
    projectIdCache = null // bei Fehler neu auflösen (Projekt evtl. verschoben)
    throw new Error(`Vikunja-Tasks: ${response.status}`)
  }

  const raw = (await response.json()) as {
    id: number
    title: string
    done: boolean
    due_date: string
    priority: number
  }[]

  const now = Date.now()
  return raw
    .filter((t) => !t.done)
    .map((t) => {
      const hasDue = t.due_date && t.due_date !== NO_DUE_DATE
      return {
        id: t.id,
        title: t.title,
        due_date: hasDue ? t.due_date : null,
        overdue: hasDue ? new Date(t.due_date).getTime() < now : false,
        priority: t.priority ?? 0,
      }
    })
    .sort((a, b) => {
      // Überfällige zuerst, dann nach Fälligkeit, ohne Fälligkeit ans Ende
      if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date)
      if (a.due_date) return -1
      if (b.due_date) return 1
      return b.priority - a.priority
    })
}

export function registerTaskRoutes(app: FastifyInstance): void {
  app.get('/api/tasks', async (request, reply) => {
    if (!vikunjaEnabled()) {
      reply.status(503)
      return { disabled: true }
    }
    try {
      const tasks = await fetchVikunjaTasks()
      reply.header('cache-control', 'private, max-age=120')
      return { tasks }
    } catch (err) {
      request.log.warn({ err }, 'Vikunja nicht erreichbar')
      reply.status(502)
      return { error: 'Vikunja nicht erreichbar' }
    }
  })
}
