# Zugriffsschutz für das Dashboard

Das Dashboard steuert das Haus (Licht, Szenen, Scripts) und zeigt private
Informationen (Termine, Anwesenheit, Dokumente). Solange es nur im Heimnetz
erreichbar ist, braucht es kein Login. Sobald es aus dem Internet erreichbar
ist, gilt die folgende Konfiguration — sonst kann jeder mit der URL das Haus
schalten und den Kalender mitlesen.

**Status (20.07.2026): eingerichtet und verifiziert.** `home.strau15.de` leitet
auf HTTPS um und schickt nicht angemeldete Aufrufe zu `auth.strau15.de`. Der
BFF-Guard ist aktiv — extern ohne Login 403, mit `Remote-User` 200, aus dem
Heimnetz 200.

## Wie der Schutz funktioniert

Der BFF unterscheidet nach Herkunft der Anfrage (`bff/src/lib/auth.ts`):

| Herkunft | Verhalten |
|---|---|
| Privates Netz (192.168.x, 10.x, 172.16–31.x, Loopback, Tailscale-CGNAT) | Immer erlaubt, kein Login — zuhause soll niemand sich anmelden müssen, um Licht zu machen |
| Aus dem Internet **mit** gültigem Auth-Header | Erlaubt |
| Aus dem Internet **ohne** Auth-Header | 403 — inklusive `/ws`, also keine Schaltbefehle |
| `/health` | Immer erlaubt, sonst schlägt der Container-Healthcheck fehl |

Aktiviert wird der Schutz über zwei Variablen:

```env
# Header, den Authelia nach erfolgreichem Login setzt
AUTH_HEADER=Remote-User
# Anzahl der Reverse-Proxy-Hops vor dem BFF (Standard 1)
TRUST_PROXY=1
```

Ohne `AUTH_HEADER` läuft das Dashboard ungeschützt und schreibt beim Start
eine Warnung ins Log.

## ⚠️ Zwei Fallstricke

**1. `TRUST_PROXY` niemals auf `true` setzen.** Dann würde die *linkeste*
Adresse aus `X-Forwarded-For` als Client-IP gelten — und die kann jeder
Aufrufer frei mitschicken. Ein Zugriff aus dem Internet könnte sich damit als
Heimnetz ausgeben und den gesamten Schutz aushebeln. Der BFF korrigiert ein
gesetztes `true` automatisch auf `1` und warnt. Mit dem korrekten Wert zählt
die Adresse, die der Reverse Proxy selbst eingetragen hat.

**2. Port 3050 darf nicht direkt ins Internet.** Der Schutz setzt voraus, dass
externer Verkehr ausschließlich über den Reverse Proxy läuft, weil nur dieser
die echte Client-Adresse einträgt. Ist der Port zusätzlich per Port-Weiterleitung
im Router offen, kann ein Angreifer den Proxy umgehen und die Herkunft frei
behaupten. In der Fritz!Box also keine Weiterleitung auf 3050 — nur der Proxy
(Port 80/443) gehört nach außen.

## Authelia im Nginx Proxy Manager

Der Proxy vor dem Dashboard ist openresty (Nginx Proxy Manager). Dort im
Proxy-Host für `home.strau15.de` unter **Advanced → Custom Nginx
Configuration** eintragen:

```nginx
location /authelia {
    internal;
    set $upstream_authelia http://<authelia-host>:9091/api/verify;
    proxy_pass_request_body off;
    proxy_pass $upstream_authelia;
    proxy_set_header Content-Length "";

    proxy_set_header X-Original-URL $scheme://$http_host$request_uri;
    proxy_set_header X-Forwarded-Method $request_method;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $http_host;
    proxy_set_header X-Forwarded-Uri $request_uri;
    proxy_set_header X-Forwarded-For $remote_addr;
}

location / {
    auth_request /authelia;

    # Authelia liefert die Identität zurück — der BFF prüft auf Remote-User
    auth_request_set $target_url $scheme://$http_host$request_uri;
    auth_request_set $user $upstream_http_remote_user;
    auth_request_set $groups $upstream_http_remote_groups;
    proxy_set_header Remote-User $user;
    proxy_set_header Remote-Groups $groups;

    # Nicht angemeldet → zur Anmeldeseite
    error_page 401 =302 https://auth.strau15.de/?rd=$target_url;

    proxy_pass http://192.168.178.109:3050;

    # WebSocket-Relay (/ws) braucht diese beiden Header
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Wichtig ist der `Upgrade`/`Connection`-Block: ohne ihn kommt der Live-State
per WebSocket nicht durch und das Dashboard bleibt leer.

## Noch zu prüfen

**Kommt der WebSocket durch Authelia?** Nach dem Login über home.strau15.de
sollten die Lichter ihren Live-Zustand zeigen. Bleiben sie leer oder auf „Aus"
stehen, reicht der Proxy die `Upgrade`/`Connection`-Header nicht durch — dann
den Block oben in der Custom-Nginx-Konfiguration ergänzen.

## Alternative ohne Authelia

Das Dashboard nicht nach außen geben und per WireGuard/Tailscale zugreifen.
Dann bleibt alles im privaten Adressraum und der Header-Schutz wird nicht
gebraucht (Tailscale-CGNAT-Adressen gelten als privat).

## Testen

Von außen prüfen — über Mobilfunk, nicht im WLAN:

```bash
# Ohne Login → 302 zur Anmeldeseite (oder 403, wenn der Aufruf den Proxy umgeht)
curl -s -o /dev/null -w '%{http_code}\n' https://home.strau15.de/api/briefing

# Heimnetz weiterhin ohne Login erreichbar
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.178.109:3050/api/briefing

# Guard direkt am Container: gefälschte Heimnetz-Herkunft muss 403 geben
curl -s -o /dev/null -w '%{http_code}\n' http://192.168.178.109:3050/api/links \
  -H 'X-Forwarded-For: 192.168.178.50, 203.0.113.7'
```
