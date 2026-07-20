# Strau15 Dashboard

Modernes Home Dashboard für Eva-Maria & Lukas mit Home Assistant und ChoreQuest Integration.

## Quick Start

```bash
# Development (Frontend + BFF zusammen; Vite proxied /api und /ws auf :8080)
npm install
cd bff && npm install && cd ..
npm run dev:all

# Production Build
npm run build

# Docker
docker compose up --build
```

**Hinweis Dev-Maschine:** `strau15machine` löst lokal evtl. nicht auf — dann `HA_URL`/`CHOREQUEST_URL` mit der IP (192.168.178.109) als Env-Vars für den BFF setzen.

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 7
- **BFF:** Node 22 + Fastify 5 (`bff/`) — hält alle Dienst-Tokens serverseitig, serviert SPA + `/api/*` + `/ws`
- **Styling:** Tailwind CSS v4 (Dark Theme Default)
- **State:** TanStack Query + React Context
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Container:** Docker (ein Image: Fastify serviert alles, kein nginx mehr)

## Externe Services

Alle Tokens leben ausschließlich im BFF (Env-Vars des Containers). Der Browser
spricht nur same-origin mit dem BFF: `/ws` (HA-Live-State-Relay), `/api/chorequest/*`
(Proxy) und die HA-Bild-Proxies (`/api/media_player_proxy/…` etc.).

### Home Assistant
- **URL:** `http://strau15machine:8123` (`HA_URL`)
- **Auth:** Long-lived Access Token via `HA_TOKEN` (nur BFF)
- Der BFF hält EINE HA-WebSocket-Verbindung (Auth, subscribe_events, State-Cache,
  Reconnect) und fanned Events an alle Browser-Clients aus. `call_service` läuft
  über eine Domain-Allowlist (`bff/src/ha/relay.ts`).

### ChoreQuest (Haushaltsmanager)
- **URL:** `http://strau15machine:8007` (`CHOREQUEST_URL`)
- **Auth:** Bearer Token via `CHOREQUEST_TOKEN` (separater Token, NICHT der HA-Token!)
- **OpenAPI:** `/openapi.json`

## Benutzer

| Name | Person Entity | ChoreQuest User |
|------|---------------|-----------------|
| Eva-Maria Schaller | `person.eva_maria_schaller` | Sync via API |
| Lukas Kraus | `person.lukas_kraus` | Sync via API |

## Home Assistant Räume (Areas)

| Area ID | Name | Lichter | Media Player |
|---------|------|---------|--------------|
| wohnzimmer | Wohnzimmer | Doppellampe, Blumenlampe, Mondschein, Lampe Ecke | Sonos |
| kuche | Küche | - | Sonos |
| schlafzimmer | Schlafzimmer | Aufwachlicht | Sonos |
| bad | Bad | Waschtisch, BadezimmerD1 | Sonos |
| bucherzimmer | Bücherzimmer | Sonoff Bücherzimmer, Hue Filament | Sonos |
| esszimmer | Esszimmer | - | - |
| ankleide | Ankleide | - | - |
| lukas_buro | Lukas Büro | - | - |
| 3d_drucker_zimmer | Hurricane 3D Labs | - (Bambu A1 Drucker, Strom-Switch) | - |
| werkstatt | Werkstatt | - | - |
| innenhof | Innenhof | Sonoff-Innenhof | - |

## Wichtige Entities

### Lichter
```
light.doppellampe
light.schlafzimmer_aufwachlicht
light.alle_nebenlichter
light.blumenlampe
light.hue_filament_bulb
light.mondschein
light.lampeecke
light.sonoff_innenhof
light.tasmota_ventilator
light.tasmota_waschtisch
light.sonoff_bucherzimmer
light.badezimmerd1
```

**Hinweis:** Alle hart verdrahteten Entity-IDs liegen zentral in `src/config/entities.ts` (Single Source of Truth).

### Globale Switches/Scripts
```
switch.alle_hauptlichter           # Alle Hauptlichter
script.alle_hauptlichter_ein       # Alle an
script.alle_hauptlichter_aus       # Alle aus
script.gute_nacht_routine          # Gute Nacht
script.alles_aus                   # Alles aus
script.musik_aus                   # Musik stoppen
```

### Media Players (Sonos)
```
media_player.wohnzimmer
media_player.kuche
media_player.schlafzimmer
media_player.bad
media_player.bucherzimmer
```

### Szenen
```
scene.licht_aus
scene.fernsehabend
```

## ChoreQuest API Endpoints

### Users
- `GET /api/users` - Liste aller Benutzer
- `GET /api/users/{id}` - Benutzer Details
- `GET /api/users/{id}/stats` - Benutzer Statistiken

### Rooms
- `GET /api/rooms` - Liste aller Räume

### Task Instances
- `GET /api/instances/today` - Heutige Aufgaben
- `POST /api/instances/{id}/complete` - Aufgabe erledigen
- `POST /api/instances/{id}/skip` - Aufgabe überspringen

### Gamification
- `GET /api/leaderboard` - Punktestand (Gesamt)
- `GET /api/leaderboard/weekly` - Wöchentlicher Punktestand
- `GET /api/achievements/{user_id}/progress` - Achievement Fortschritt

## Projektstruktur

```
bff/                                # Fastify-BFF (eigenes npm-Paket)
└── src/
    ├── index.ts                    # Bootstrap, SPA-Serving, Shutdown
    ├── config.ts                   # Env-Schema (mit VITE_*-Aliassen)
    ├── ha/connection.ts            # HA-Upstream-WS + State-Cache
    ├── ha/relay.ts                 # /ws Browser-Relay (Allowlist, Fanout)
    ├── routes/health.ts            # /health + /api/status
    ├── routes/chorequest.ts        # /api/chorequest/* Proxy
    ├── routes/ha-proxy.ts          # HA-Bild-Proxy (Album-Art, Avatare, Kamera)
    └── lib/upstream.ts             # fetch-Helper
shared/
└── api-types.ts                    # WS-Protokolltypen (Frontend + BFF)
src/
├── api/
│   └── chorequest.ts           # ChoreQuest API Client (typisiert)
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Haupt-Layout mit Sidebar/BottomNav
│   │   ├── Header.tsx          # Mobile Header mit User-Selector
│   │   ├── Sidebar.tsx         # Desktop Navigation
│   │   └── BottomNav.tsx       # Mobile Navigation
│   ├── widgets/
│   │   ├── LightWidget.tsx     # Licht-Steuerung mit Dimmer
│   │   ├── SceneWidget.tsx     # Szenen aktivieren
│   │   ├── ScriptWidget.tsx    # Scripts ausführen
│   │   ├── TaskWidget.tsx      # Aufgaben mit Quick-Complete
│   │   ├── LeaderboardWidget.tsx # Wochenrangliste
│   │   ├── MediaWidget.tsx     # Sonos-Steuerung
│   │   └── ...                 # Weather, Alarm, WasteCollection, Printer*

│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Toggle.tsx
│       └── Slider.tsx
├── contexts/
│   ├── HomeAssistantContext.tsx  # WebSocket + Entity State
│   └── UserContext.tsx           # Aktueller Benutzer
├── hooks/
│   ├── useHomeAssistant.ts       # WebSocket Hook
│   └── useChoreQuest.ts          # TanStack Query Hooks
├── pages/
│   ├── Dashboard.tsx             # Übersicht
│   ├── Lights.tsx                # Alle Lichter
│   ├── Music.tsx                 # Sonos-Steuerung
│   ├── Tasks.tsx                 # Aufgaben-Liste
│   ├── Rooms.tsx                 # Raum-Übersicht
│   └── Room.tsx                  # Einzelner Raum
├── types/
│   ├── homeassistant.ts          # HA Entity Types
│   └── chorequest.ts             # ChoreQuest API Types
├── config/
│   └── entities.ts               # Zentrale Entity-IDs (Single Source of Truth)
├── App.tsx
├── main.tsx
└── index.css                     # Tailwind + Custom Theme
```

## Environment Variables

Alle Variablen sind **BFF-Env-Vars** (serverseitig, kein `VITE_`-Präfix mehr im
Frontend-Build). Die alten `VITE_*`-Namen werden vom BFF übergangsweise als
Aliase akzeptiert (siehe `bff/src/config.ts`).

```env
# Pflicht
HA_URL=http://strau15machine:8123
HA_TOKEN=<home-assistant-long-lived-access-token>
CHOREQUEST_URL=http://strau15machine:8007
CHOREQUEST_TOKEN=<chorequest-api-token>

# Optional (Phase 2 — fehlende Werte deaktivieren nur das jeweilige Feature)
ANTHROPIC_API_KEY=  IMMICH_URL=  IMMICH_API_KEY=
VIKUNJA_URL=  VIKUNJA_TOKEN=  VIKUNJA_PROJECT=Strau15
PAPERLESS_URL=  PAPERLESS_TOKEN=  BRIEFING_TTL_HOURS=6
```

**Wichtig:** Home Assistant und ChoreQuest verwenden separate Tokens!

## Docker Deployment

```bash
# Build und Start (Tokens aus .env)
docker compose up --build -d
```

Ein Container: Fastify (Port 8080 intern) serviert SPA, `/api/*` und `/ws`.
Dashboard erreichbar unter `http://localhost:3001` (bzw. `DASHBOARD_PORT`).
Produktiv läuft das Image `ghcr.io/evarinou/strau15dashboard:latest` auf
strau15machine (Port 3050), Deploy via GitHub Actions + Watchtower bei Push auf main.

## Design System

Design-Sprache „Warm & wohnlich" — editorial, passend zum Haus von 1842.
**Typo-Regel (Kern des Looks):** Serif (Fraunces Variable) NUR für Begrüßung und
KI-Briefing; alles Funktionale (Tasks, Zahlen, Labels) in Source Sans 3.
Beide Fonts self-hosted via @fontsource (Import in `src/index.css`).

### Farben (Tailwind @theme in src/index.css)
```css
--color-surface: #F1EFE8;           /* Grundfläche Sandbeige */
--color-surface-elevated: #FAF7F0;  /* Cards cremeweiß */
--color-border: #D3D1C7;
--color-text-primary: #2C2C2A;
--color-text-secondary: #5F5E5A;    /* warmes Grau */
--color-accent: #D85A30;            /* Terrakotta */
--color-accent-ink: #4A1B0C;        /* Terrakotta-Text stark */
--color-accent-text: #712B13;
--color-accent-soft: #993C1D;
--color-photo-surface: #FBEAF0;     /* Foto-Block Altrosa */
--color-photo-ink: #4B1528;
--color-photo-text: #993556;
--color-success: #4C7A5C;  --color-warning: #A8752B;  --color-danger: #B23B2E;
```

**Formsprache:** Cards Radius 12–16px. Terrakotta-Akzent als linke Kante
(`Card tone="accent"`: border-left 4px, links eckig, rechts 14px Radius);
Foto-Block als `Card tone="photo"` in Altrosa.

### Komponenten
- **Touch Targets:** Min. 44px für touch-friendly Buttons
- **Animationen:** 150-300ms Transitions
- **Responsive:** Mobile-first, Desktop ab `lg:` (1024px)

## WebSocket Integration

Zwei Ebenen, Protokolltypen in `shared/api-types.ts`:

1. **BFF ↔ Home Assistant** (`bff/src/ha/connection.ts`): Auth-Handshake mit
   `HA_TOKEN`, `subscribe_events` VOR `get_states` (sonst Event-Lücke),
   State-Cache als Map, Reconnect mit exponential backoff (1s → 30s max).
2. **Browser ↔ BFF** (`/ws`, tokenlos, `bff/src/ha/relay.ts` +
   `src/hooks/useHomeAssistant.ts`): Bei Connect kommt `{type:'init', connected,
   states[]}`; danach `state_changed`-Fanout. `call_service` vom Client wird mit
   Domain-Allowlist geprüft, upstream neu nummeriert und das `result` nur an den
   Absender zurückgegeben.

## API Integration

### TanStack Query
- Automatic caching (30s stale time)
- Background refetch
- Optimistic updates für Task-Completion

### ChoreQuest Hooks
```typescript
// Heutige Aufgaben (auto-refetch alle 30s)
const { data: tasks } = useTodayInstances()

// Aufgabe erledigen
const complete = useCompleteInstance()
await complete.mutateAsync({ id: taskId, data: { user_id: 1 } })

// Leaderboard
const { data: leaderboard } = useWeeklyLeaderboard()
```

## Features

### Startseite
- KI-Briefing „Was war / was kommt" (BriefingCard, Serif) — generiert im BFF
  via Anthropic-API (`claude-opus-4-8`), Cache in `/data/briefing.json`,
  feste Generierung 06:00/16:00 Europe/Berlin + stale-while-revalidate,
  Nicht-KI-Fallback wenn Anthropic nicht erreichbar
- Immich-Fotos „heute vor X Jahren" (PhotosCard, Altrosa; Thumbnails via BFF-Proxy).
  Optionaler Personen-Filter via `IMMICH_PEOPLE` (Namen wie in Immich benannt,
  kommagetrennt). Mehrere Namen wirken als ODER — pro Person eine Abfrage, weil
  Immich mehrere `personIds` mit UND verknüpft. `GET /api/photos/people` listet
  die erkannten Namen und zeigt, welche greifen.
- Kalender-Block inkl. Müllabholung (CalendarCard, via HA-REST im BFF)
- Vikunja-Tasks aus Projekt „Strau15" (VikunjaCard)
- ChoreQuest: heutige Aufgaben mit One-Click Complete + Wochenrangliste
- Paperless: letzte Dokumente, read-only (DocumentsCard)
- Haus-Zeile: Schnellzugriff (Scripts/Szene), Lichter-Zähler, Wecker
- Fehlt eine Server-Env-Var, liefert der BFF 503 {disabled:true} und die
  jeweilige Karte blendet sich aus (Hooks in `src/hooks/useBff.ts`)

**Externe Links:** `*_PUBLIC_URL`-Variablen (HA/IMMICH/PAPERLESS/VIKUNJA/
CHOREQUEST) trennen die im Browser anklickbaren Domains von den internen
Service-URLs, die der BFF für seine API-Aufrufe nutzt. `GET /api/links`
liefert sie ans Frontend (Hook `useLinks`); ohne gesetzten Wert fällt der
Link auf die interne URL zurück. Genutzt in der Sidebar-Sektion „Dienste",
der Foto-Karte (Deep-Link je Bild) sowie Vikunja- und Paperless-Karte.

### Lichter
- Grid-Ansicht aller Lichter
- Toggle + Brightness Slider
- Globale Steuerung (Alle an/aus)

### Musik
- Sonos-Player pro Raum
- Play/Pause, Volume
- Globales Stoppen

### Aufgaben
- Filterung nach Raum
- Task-Completion mit Celebration Animation
- Achievement-Fortschritt
- Punkte-Anzeige

### Räume
- Übersicht aller Räume
- Raum-spezifische Lichter, Media, Aufgaben
