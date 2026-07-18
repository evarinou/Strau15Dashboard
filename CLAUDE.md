# Strau15 Dashboard

Modernes Home Dashboard für Eva-Maria & Lukas mit Home Assistant und ChoreQuest Integration.

## Quick Start

```bash
# Development
npm install
npm run dev

# Production Build
npm run build

# Docker
docker compose up --build
```

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite 7
- **Styling:** Tailwind CSS v4 (Dark Theme Default)
- **State:** TanStack Query + React Context
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Container:** Docker + nginx

## Externe Services

### Home Assistant
- **URL:** `http://strau15machine:8123`
- **WebSocket:** `ws://strau15machine:8123/api/websocket`
- **Auth:** Long-lived Access Token via `VITE_HA_TOKEN` env var

### ChoreQuest (Haushaltsmanager)
- **URL:** `http://strau15machine:8007`
- **Auth:** Bearer Token via `VITE_CHOREQUEST_TOKEN` (separater Token, NICHT der HA-Token!)
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

```env
VITE_HA_URL=http://strau15machine:8123
VITE_HA_WS_URL=ws://strau15machine:8123/api/websocket
VITE_HA_TOKEN=<home-assistant-long-lived-access-token>
VITE_CHOREQUEST_URL=http://strau15machine:8007
VITE_CHOREQUEST_TOKEN=<chorequest-api-token>
```

**Wichtig:** Home Assistant und ChoreQuest verwenden separate Tokens!

## Docker Deployment

```bash
# Build und Start
docker compose up --build -d

# Mit explizitem Token
HA_TOKEN=your-token docker compose up --build -d
```

Dashboard erreichbar unter `http://localhost:3000`

## Design System

### Farben (Tailwind Custom Theme)
```css
--color-surface: oklch(0.145 0.014 285.82);        /* Hintergrund */
--color-surface-elevated: oklch(0.205 0.015 285.82); /* Cards */
--color-surface-hover: oklch(0.269 0.015 285.82);  /* Hover States */
--color-border: oklch(0.371 0.017 285.82);         /* Borders */
--color-text-primary: oklch(0.985 0 0);            /* Haupttext */
--color-text-secondary: oklch(0.708 0.014 285.82); /* Sekundärtext */
--color-accent: oklch(0.623 0.214 259.13);         /* Akzentfarbe (Blau) */
--color-success: oklch(0.627 0.194 149.21);        /* Erfolg (Grün) */
--color-warning: oklch(0.769 0.188 70.08);         /* Warnung (Gelb) */
--color-danger: oklch(0.577 0.245 27.33);          /* Fehler (Rot) */
```

### Komponenten
- **Touch Targets:** Min. 44px für touch-friendly Buttons
- **Animationen:** 150-300ms Transitions
- **Responsive:** Mobile-first, Desktop ab `lg:` (1024px)

## WebSocket Integration

### Verbindung
- Automatische Reconnection mit exponential backoff (1s → 30s max)
- Auth via Long-lived Access Token
- State-Caching im React Context

### Events
```typescript
// Subscribe to state changes
{ type: 'subscribe_events', event_type: 'state_changed' }

// Call service
{
  type: 'call_service',
  domain: 'light',
  service: 'toggle',
  target: { entity_id: 'light.doppellampe' }
}
```

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

### Dashboard
- Begrüßung mit aktuellem Datum
- Schnellzugriff: Alle Lichter, Szenen, Gute Nacht
- Heutige Aufgaben mit One-Click Complete
- Wochenrangliste (Eva-Maria vs Lukas)
- Müllabholung (calendar.landkreis_kronach) + Wecker-Widget

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
