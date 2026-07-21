# Strau15 Dashboard — Stand & nächste Schritte

Stand: 21. Juli 2026. Dieses Dokument ist der Einstiegspunkt für die nächste
Arbeitssitzung: was läuft, was als Nächstes ansteht, was offen ist.

## Kurzüberblick

Das Dashboard führt Haus (Home Assistant) und Homeserver-Dienste zu einer
Oberfläche zusammen. Erreichbar unter **https://home.strau15.de** (extern, hinter
Authelia) und **http://192.168.178.109:3050** (im Heimnetz, ohne Login).

Ein Container, ein Image: `ghcr.io/evarinou/strau15dashboard:latest`. Fastify
(BFF) serviert die SPA, `/api/*` und den WebSocket-Relay `/ws`. Deploy über
GitHub Actions bei Push auf `main`, Watchtower zieht das neue Image.

Architektur und Konventionen stehen in `CLAUDE.md`, der Zugriffsschutz in
`SICHERHEIT.md`, die Server-Compose in `docker-compose.prod.yml`.

## Abgeschlossen

**Phase 0 — Stabilisieren.** Healthcheck-Fehler behoben (BusyBox-wget löste
`localhost` zu `::1` auf, nginx lauschte nur auf IPv4). Tote Geräte entfernt
(Roborock, Thermostat, Druckraumbeleuchtung). Entity-IDs zentral in
`src/config/entities.ts`.

**Phase 1 — BFF.** Node/Fastify zwischen Browser und Diensten. Alle Tokens
liegen serverseitig; der Browser spricht nur same-origin mit dem BFF. Eine
HA-WebSocket-Verbindung wird an beliebig viele Clients gefanned; `call_service`
läuft über eine Domain-Allowlist. nginx und die `config.js`-Token-Injektion
sind entfallen.

**Phase 2 — Startseite.** Warmes Editorial-Theme (Sandbeige/Terrakotta, Serif
nur für Begrüßung und Briefing). Sechs Bausteine: KI-Briefing, Immich-Fotos,
Kalender, Vikunja, ChoreQuest, Paperless. Fehlt eine Env-Var, blendet sich die
jeweilige Karte aus.

**Zugriffsschutz.** Authelia vor dem Dashboard; der BFF verlangt für Zugriffe
aus dem Internet den `Remote-User`-Header, das Heimnetz bleibt frei.
Verifiziert am 20.07.: extern ohne Login 403, mit Header 200, LAN 200.

**Phase 3 — Medien-Kommandozentrum.** Seite `/medien` mit drei Bereichen:
„Was schauen wir?" (Jellyfin: Weiterschauen + Neues, Poster-Bänder), „Was
kommt?" (Sonarr+Radarr-Kalender gemerged, ausfalltolerant) und „Wunsch
äußern" (Seerr-Suche mit Anfrage hinter Inline-Bestätigung — die einzige
schreibende Aktion). Alle Poster als Byte-Proxy (auch TMDB), Keys nur im
BFF, `GET /api/media/status` steuert die Karten-Sichtbarkeit. API-Annahmen
vorab gegen die echten Instanzen verifiziert (Seerr 3.2.0 ist der
Jellyseerr-Nachfolger; Jellyfin 10.11 nutzt `/UserItems/Resume`). Auf dem
Server laufen alle vier Dienste; Jellyfin hat genau einen (gemeinsamen)
Account.

## Als Nächstes

Kein festes nächstes Großthema — Kandidaten aus dem Backlog unten:
Widget-Feinschliff, Briefing vertiefen, Lint-Altlasten.

## Offene Punkte

**Bitte einmal prüfen:** Lädt das Dashboard nach dem Authelia-Login über
home.strau15.de vollständig — zeigen die Lichter ihren Live-Zustand? Wenn der
Proxy die `Upgrade`/`Connection`-Header nicht durchreicht, kommt der
WebSocket nicht durch und die Seite bleibt ohne Live-Daten. Die passende
Konfiguration steht in `SICHERHEIT.md`.

**Nicht reproduzierter Bug:** Es gab die Meldung, ein Licht oder Schalter
reagiere nicht. Live-Test (Blumenlampe an/aus über den Relay), alle 32
verdrahteten Entities und die neun Wecker-Entities waren in Ordnung.
Offline-Geräte zeigen inzwischen Sperr-Cursor und Tooltip. Falls es
wiederkommt: Gerät und Seite notieren.

**Feinschliff (Backlog):** Räume, Musik, Aufgaben und Lichter tragen noch das
alte Widget-Muster, nur umgefärbt — sie könnten auf das Terrakotta-Card-Muster
gebracht und die Neon-/Glass-Reste in `src/index.css` zurückgebaut werden.

**Briefing vertiefen (Backlog):** Aktuell nur der aktuelle Wetterzustand;
Vorhersage, Geburtstage und ein längerer Rückblick würden ihm mehr Substanz
geben.

**Altlast:** `npm run lint` meldet ~38 Fehler aus der Zeit vor diesem Umbau
(vor allem `react-hooks/purity` in Wetter- und Drucker-Widgets). Nicht
kritisch, aber sie verdecken neue Warnungen.

## Betriebswissen

- **Dev:** `npm run dev:all` startet Vite und BFF zusammen; Vite proxied `/api`
  und `/ws` auf Port 8080. Der Hostname `strau15machine` löst auf dem
  Entwicklungsrechner nicht auf — dort `HA_URL`/`CHOREQUEST_URL` mit
  `192.168.178.109` überschreiben.
- **Deploy:** Push auf `main` → GitHub Actions → Watchtower. Kein manuelles
  Eingreifen nötig; bis das neue Image läuft, vergehen einige Minuten.
- **Server-Compose:** `docker-compose.prod.yml` (nutzt `image:`), nicht die
  lokale `docker-compose.yml` (nutzt `build:`) — Letztere schlägt auf dem
  Server fehl, weil dort kein Quellcode liegt.
- **URLs in Env-Vars** dürfen das Protokoll weglassen, der BFF ergänzt `http://`
  und warnt. Sauberer ist es, `https://` mitzuschreiben.
