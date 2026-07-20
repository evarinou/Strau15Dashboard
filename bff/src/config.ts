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

/**
 * Normalisiert eine Dienst-URL: ergänzt fehlendes http:// und schneidet
 * abschließende Slashes ab. Ohne Protokoll wirft fetch() nämlich sofort,
 * bevor überhaupt eine Verbindung versucht wird — das sieht dann wie ein
 * nicht erreichbarer Dienst aus, obwohl nur das Schema fehlt.
 */
function serviceUrl(label: string, value: string | undefined): string | undefined {
  if (!value) return undefined
  let url = value.trim().replace(/\/+$/, '')
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(url)) {
    url = `http://${url}`
    console.warn(`[config] ${label} ohne Protokoll — verwende ${url}`)
  }
  return url
}

const haUrl =
  serviceUrl('HA_URL', env('HA_URL', 'VITE_HA_URL')) ?? 'http://strau15machine:8123'

export const config = {
  port: Number(env('PORT') ?? 8080),
  publicDir: env('PUBLIC_DIR') ?? new URL('../../../dist', import.meta.url).pathname,
  dataDir: env('DATA_DIR') ?? '/data',

  haUrl,
  haWsUrl:
    env('HA_WS_URL', 'VITE_HA_WS_URL') ??
    `${haUrl.replace(/^http/, 'ws')}/api/websocket`,
  haToken: required('HA_TOKEN', env('HA_TOKEN', 'VITE_HA_TOKEN')),

  choreQuestUrl:
    serviceUrl('CHOREQUEST_URL', env('CHOREQUEST_URL', 'VITE_CHOREQUEST_URL')) ??
    'http://strau15machine:8007',
  choreQuestToken: required(
    'CHOREQUEST_TOKEN',
    env('CHOREQUEST_TOKEN', 'VITE_CHOREQUEST_TOKEN')
  ),

  // Phase-2-Dienste: optional — fehlende Werte deaktivieren nur das Feature.
  anthropicApiKey: env('ANTHROPIC_API_KEY'),
  immichUrl: serviceUrl('IMMICH_URL', env('IMMICH_URL')),
  immichApiKey: env('IMMICH_API_KEY'),
  /** Optionaler Personen-Filter für „heute vor X Jahren", z.B. "Eva-Maria,Lukas".
   *  Leer = alle Fotos des Tages. Namen wie in Immich benannt. */
  immichPeople:
    env('IMMICH_PEOPLE')
      ?.split(',')
      .map((name) => name.trim())
      .filter(Boolean) ?? [],
  vikunjaUrl: serviceUrl('VIKUNJA_URL', env('VIKUNJA_URL')),
  vikunjaToken: env('VIKUNJA_TOKEN'),
  vikunjaProject: env('VIKUNJA_PROJECT') ?? 'Strau15',
  paperlessUrl: serviceUrl('PAPERLESS_URL', env('PAPERLESS_URL')),
  paperlessToken: env('PAPERLESS_TOKEN'),
  briefingTtlHours: Number(env('BRIEFING_TTL_HOURS') ?? 6),

  /**
   * Öffentliche URLs für Links im Browser (z.B. https://paperless.strau15.de).
   * Getrennt von den internen Service-URLs: der BFF ruft die Dienste weiter
   * intern auf, nur die anklickbaren Links zeigen nach außen. Ohne gesetzten
   * Wert fällt der Link auf die interne URL zurück.
   */
  publicUrls: {
    homeAssistant:
      serviceUrl('HA_PUBLIC_URL', env('HA_PUBLIC_URL')) ?? haUrl,
    paperless:
      serviceUrl('PAPERLESS_PUBLIC_URL', env('PAPERLESS_PUBLIC_URL')) ??
      serviceUrl('PAPERLESS_URL', env('PAPERLESS_URL')),
    immich:
      serviceUrl('IMMICH_PUBLIC_URL', env('IMMICH_PUBLIC_URL')) ??
      serviceUrl('IMMICH_URL', env('IMMICH_URL')),
    vikunja:
      serviceUrl('VIKUNJA_PUBLIC_URL', env('VIKUNJA_PUBLIC_URL')) ??
      serviceUrl('VIKUNJA_URL', env('VIKUNJA_URL')),
    choreQuest:
      serviceUrl('CHOREQUEST_PUBLIC_URL', env('CHOREQUEST_PUBLIC_URL')) ??
      serviceUrl('CHOREQUEST_URL', env('CHOREQUEST_URL', 'VITE_CHOREQUEST_URL')) ??
      'http://strau15machine:8007',
  },
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
