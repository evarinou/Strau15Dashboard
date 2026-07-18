// Gemeinsamer fetch-Helfer für Upstream-Dienste (ChoreQuest, später
// Immich/Vikunja/Paperless): Timeout, Auth-Header, normierte Fehler.

export class UpstreamError extends Error {
  constructor(
    public readonly upstream: string,
    public readonly status: number,
    public readonly body: string
  ) {
    super(`${upstream}: ${status} - ${body.slice(0, 300)}`)
  }
}

export interface UpstreamOptions {
  method?: string
  headers?: Record<string, string>
  body?: string
  timeoutMs?: number
}

export async function upstreamFetch(
  upstream: string,
  url: string,
  options: UpstreamOptions = {}
): Promise<Response> {
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: options.headers,
    body: options.body,
    signal: AbortSignal.timeout(options.timeoutMs ?? 10_000),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new UpstreamError(upstream, response.status, body)
  }

  return response
}
