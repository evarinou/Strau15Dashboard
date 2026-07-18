import type { FastifyInstance } from 'fastify'
import type { HaConnection } from '../ha/connection.js'

export function registerHealthRoutes(app: FastifyInstance, ha: HaConnection): void {
  // Muss IMMER 200 liefern, auch wenn HA down ist — sonst gerät der
  // Container bei einem HA-Ausfall in eine Restart-Schleife.
  app.get('/health', async () => 'OK')

  app.get('/api/status', async () => ({
    ha: { connected: ha.connected, entities: ha.states.size },
  }))
}
