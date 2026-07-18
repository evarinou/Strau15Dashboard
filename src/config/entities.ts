// Zentrale Entity-Konfiguration — einzige Quelle der Wahrheit für
// hart verdrahtete Home-Assistant-Entity-IDs. Gegen den echten
// HA-Stand verifiziert (tote Entities entfernt, Juli 2026).

export interface SwitchLight {
  id: string
  /** Voller Name für Widget-Listen (z.B. Raumseite) */
  label: string
  /** Kurzname für kompakte Chips (z.B. Räume-Übersicht) */
  shortLabel: string
}

// Lichter (light.*) pro Raum
export const ROOM_LIGHTS: Record<string, string[]> = {
  wohnzimmer: ['light.blumenlampe', 'light.mondschein'],
  schlafzimmer: ['light.doppellampe', 'light.lampeecke'],
  bad: ['light.tasmota_waschtisch', 'light.badezimmerd1'],
  bucherzimmer: ['light.sonoff_bucherzimmer', 'light.hue_filament_bulb'],
  innenhof: ['light.sonoff_innenhof'],
}

// Switch-basierte Lichter/Geräte pro Raum
export const ROOM_SWITCH_LIGHTS: Record<string, SwitchLight[]> = {
  ankleide: [{ id: 'switch.sonoff_ankleide_ankleide', label: 'Deckenlampe', shortLabel: 'Decke' }],
  esszimmer: [{ id: 'switch.sonoff_esszimmer_esszimmer', label: 'Deckenlampe', shortLabel: 'Decke' }],
  kuche: [{ id: 'switch.sonoff_kueche_kueche', label: 'Deckenlampe', shortLabel: 'Decke' }],
  schlafzimmer: [
    { id: 'switch.sonoff_schlafzimmer_schlafzimmer', label: 'Deckenlampe', shortLabel: 'Decke' },
    { id: 'switch.0xec1bbdfffefd3660', label: 'Steckdosenlampe', shortLabel: 'Steckdose' },
  ],
  bucherzimmer: [{ id: 'switch.steckdosenswitch_buchzimmer', label: 'Steckdosenlampe', shortLabel: 'Steckdose' }],
  wohnzimmer: [{ id: 'switch.steckdose_wohnzimmer', label: 'Steckdosenlampe', shortLabel: 'Steckdose' }],
  lukas_buro: [{ id: 'switch.0xb4e3f9fffec0451b', label: 'Schreibtisch', shortLabel: 'Schreibtisch' }],
  '3d_drucker_zimmer': [{ id: 'switch.0x5c0272fffe7f9e5c', label: '3D-Drucker Strom', shortLabel: 'Drucker' }],
}

// Sonos Media Player pro Raum
export const ROOM_MEDIA: Record<string, string> = {
  wohnzimmer: 'media_player.wohnzimmer',
  kuche: 'media_player.kuche',
  schlafzimmer: 'media_player.schlafzimmer',
  bad: 'media_player.bad',
  bucherzimmer: 'media_player.bucherzimmer',
}

export const MEDIA_PLAYERS = Object.values(ROOM_MEDIA)

// Alle einzeln steuerbaren light.*-Entities (Lichter-Seite)
export const LIGHT_ENTITIES = [
  'light.doppellampe',
  'light.schlafzimmer_aufwachlicht',
  'light.alle_nebenlichter',
  'light.blumenlampe',
  'light.hue_filament_bulb',
  'light.mondschein',
  'light.lampeecke',
  'light.sonoff_innenhof',
  'light.tasmota_ventilator',
  'light.tasmota_waschtisch',
  'light.sonoff_bucherzimmer',
  'light.badezimmerd1',
]

// Hauptlichter (Switch-basiert, Lichter-Seite)
export const SWITCH_LIGHT_ENTITIES: SwitchLight[] = [
  { id: 'switch.sonoff_ankleide_ankleide', label: 'Ankleide', shortLabel: 'Ankleide' },
  { id: 'switch.sonoff_esszimmer_esszimmer', label: 'Esszimmer', shortLabel: 'Esszimmer' },
  { id: 'switch.sonoff_kueche_kueche', label: 'Küche', shortLabel: 'Küche' },
  { id: 'switch.sonoff_schlafzimmer_schlafzimmer', label: 'Schlafzimmer Decke', shortLabel: 'Schlafzimmer' },
  { id: 'switch.0xb4e3f9fffe7cb0ae', label: 'Treppenhaus', shortLabel: 'Treppenhaus' },
]

// Kurznamen für Licht-Chips (Räume-Übersicht)
export const LIGHT_NAMES: Record<string, string> = {
  'light.doppellampe': 'Doppel',
  'light.blumenlampe': 'Blume',
  'light.mondschein': 'Mond',
  'light.lampeecke': 'Ecke',
  'light.tasmota_waschtisch': 'Wasch',
  'light.badezimmerd1': 'Decke',
  'light.sonoff_bucherzimmer': 'Sonoff',
  'light.hue_filament_bulb': 'Hue',
  'light.sonoff_innenhof': 'Hof',
}

// Globale Scripts & Szenen
export const SCRIPTS = {
  alleHauptlichterEin: 'script.alle_hauptlichter_ein',
  alleHauptlichterAus: 'script.alle_hauptlichter_aus',
  guteNachtRoutine: 'script.gute_nacht_routine',
  allesAus: 'script.alles_aus',
  musikAus: 'script.musik_aus',
} as const

export const SCENES = {
  fernsehabend: 'scene.fernsehabend',
  lichtAus: 'scene.licht_aus',
} as const

// Sonstige Entities
export const WEATHER_ENTITY = 'weather.forecast_home'
export const WASTE_CALENDAR = 'calendar.landkreis_kronach'

// Bambu Lab A1 (3D-Drucker) — Entity-Präfix für Pattern-basierte Erkennung
export const PRINTER_PREFIX = 'a1_03919d4b2001225'
