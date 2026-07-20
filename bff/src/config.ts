// Env-Schema des BFF. Alte VITE_*-Namen werden als Aliase akzeptiert,
// damit der Watchtower-Cutover ohne Remote-Compose-Änderung funktioniert.

function env(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name]
    if (value !== undefined && value !== '') return value
  }
  return undefined
}

function required(label: string, value: string | undefined): string {
  if (!value) {
    console.error(`[config] Pflicht-Variable fehlt: ${label}`)
    process.exit(1)
  }
  return value
}

const haUrl = env('HA_URL', 'VITE_HA_URL') ?? 'http://strau15machine:8123'

export const config = {
  port: Number(env('PORT') ?? 8080),
  publicDir: env('PUBLIC_DIR') ?? new URL('../../../dist', import.meta.url).pathname,
  dataDir: env('DATA_DIR') ?? '/data',

  haUrl,
  haWsUrl:
    env('HA_WS_URL', 'VITE_HA_WS_URL') ??
    `${haUrl.replace(/^http/, 'ws')}/api/websocket`,
  haToken: required('HA_TOKEN', env('HA_TOKEN', 'VITE_HA_TOKEN')),

  choreQuestUrl: env('CHOREQUEST_URL', 'VITE_CHOREQUEST_URL') ?? 'http://strau15machine:8007',
  choreQuestToken: required(
    'CHOREQUEST_TOKEN',
    env('CHOREQUEST_TOKEN', 'VITE_CHOREQUEST_TOKEN')
  ),

  // Phase-2-Dienste: optional — fehlende Werte deaktivieren nur das Feature.
  anthropicApiKey: env('ANTHROPIC_API_KEY'),
  immichUrl: env('IMMICH_URL'),
  immichApiKey: env('IMMICH_API_KEY'),
  /** Optionaler Personen-Filter für „heute vor X Jahren", z.B. "Eva-Maria,Lukas".
   *  Leer = alle Fotos des Tages. Namen wie in Immich benannt. */
  immichPeople:
    env('IMMICH_PEOPLE')
      ?.split(',')
      .map((name) => name.trim())
      .filter(Boolean) ?? [],
  vikunjaUrl: env('VIKUNJA_URL'),
  vikunjaToken: env('VIKUNJA_TOKEN'),
  vikunjaProject: env('VIKUNJA_PROJECT') ?? 'Strau15',
  paperlessUrl: env('PAPERLESS_URL'),
  paperlessToken: env('PAPERLESS_TOKEN'),
  briefingTtlHours: Number(env('BRIEFING_TTL_HOURS') ?? 6),
}

export function logFeatureStatus(): void {
  const features: Record<string, boolean> = {
    'ha-relay': true,
    chorequest: true,
    briefing: Boolean(config.anthropicApiKey),
    photos: Boolean(config.immichUrl && config.immichApiKey),
    'photos-personenfilter': config.immichPeople.length > 0,
    tasks: Boolean(config.vikunjaUrl && config.vikunjaToken),
    documents: Boolean(config.paperlessUrl && config.paperlessToken),
  }
  for (const [name, enabled] of Object.entries(features)) {
    console.log(`[config] Feature ${name}: ${enabled ? 'aktiv' : 'deaktiviert (Env fehlt)'}`)
  }
}
