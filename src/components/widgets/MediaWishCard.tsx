import { useEffect, useState } from 'react'
import { Popcorn, Search } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import {
  useMediaRequest,
  useMediaSearch,
  useMediaStatus,
  type SearchResult,
  type SearchStatus,
} from '../../hooks/useMedia'

// „Wunsch äußern" — Seerr-Suche mit Anfrage-Knopf. Die Anfrage wird
// automatisch genehmigt und stößt die Suche im Hintergrund an, deshalb
// die Inline-Bestätigung vor dem Absenden.

const STATUS_LABEL: Record<Exclude<SearchStatus, 'none'>, { text: string; className: string }> = {
  available: { text: 'Verfügbar', className: 'text-success' },
  partial: { text: 'Teilweise da', className: 'text-success' },
  processing: { text: 'Wird geladen', className: 'text-warning' },
  pending: { text: 'Angefragt', className: 'text-warning' },
}

function RequestButton({ result }: { result: SearchResult }) {
  const request = useMediaRequest()
  const [confirming, setConfirming] = useState(false)

  // Bestätigung läuft nach 5s ab — sonst bleibt am Küchendisplay ein
  // scharfer „Wirklich?"-Knopf stehen
  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 5000)
    return () => clearTimeout(timer)
  }, [confirming])

  if (result.status !== 'none') {
    const label = STATUS_LABEL[result.status]
    return <span className={`text-xs font-semibold ${label.className}`}>{label.text}</span>
  }
  if (request.isSuccess) {
    return <span className="text-xs font-semibold text-warning">Angefragt</span>
  }
  if (request.isError) {
    return (
      <span className="text-xs text-danger" title={request.error.message}>
        {/Bereits|exists|already/i.test(request.error.message)
          ? 'Schon angefragt'
          : 'Fehlgeschlagen'}
      </span>
    )
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <Button
          size="sm"
          onClick={() =>
            request.mutate({ mediaType: result.mediaType, mediaId: result.id })
          }
          disabled={request.isPending}
        >
          Wirklich?
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Nein
        </Button>
      </span>
    )
  }
  return (
    <Button size="sm" variant="secondary" onClick={() => setConfirming(true)}>
      Anfragen
    </Button>
  )
}

function ResultRow({ result }: { result: SearchResult }) {
  return (
    <li className="flex items-center gap-3 min-w-0">
      <div className="relative w-9 aspect-[2/3] rounded-lg overflow-hidden glass-inset flex-shrink-0">
        <Popcorn className="absolute inset-0 m-auto w-4 h-4 text-text-muted" aria-hidden="true" />
        {result.image && (
          <img
            src={result.image}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{result.title}</p>
        <p className="text-xs text-text-secondary">
          {result.mediaType === 'tv' ? 'Serie' : 'Film'}
          {result.year && ` · ${result.year}`}
        </p>
      </div>
      <div className="flex-shrink-0">
        <RequestButton result={result} />
      </div>
    </li>
  )
}

export function MediaWishCard() {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const { data: status } = useMediaStatus()
  const search = useMediaSearch(query)

  // Erst nach kurzer Tipp-Pause suchen, nicht bei jedem Zeichen
  useEffect(() => {
    const timer = setTimeout(() => setQuery(input), 300)
    return () => clearTimeout(timer)
  }, [input])

  // Seerr serverseitig nicht konfiguriert → Karte ausblenden
  if (!status?.wish) return null

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Wunsch äußern</CardTitle>
      </CardHeader>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="search"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Film oder Serie suchen …"
          className="glass-inset w-full pl-9 pr-3 py-2.5 rounded-xl text-text-primary placeholder:text-text-muted focus:outline-2 focus:outline-accent transition-colors"
        />
      </div>
      {search.isFetching && (
        <p className="mt-3 text-xs text-text-muted">Suche läuft …</p>
      )}
      {search.isError && (
        <p className="mt-3 text-xs text-danger">Suche fehlgeschlagen — Seerr erreichbar?</p>
      )}
      {search.data && search.data.results.length === 0 && (
        <p className="mt-3 text-sm text-text-secondary">Nichts gefunden.</p>
      )}
      {search.data && search.data.results.length > 0 && (
        <ul className="mt-4 space-y-2.5">
          {search.data.results.map((result) => (
            <ResultRow key={`${result.mediaType}-${result.id}`} result={result} />
          ))}
        </ul>
      )}
      <p className="mt-4 text-[11px] text-text-muted">
        Angefragtes wird automatisch gesucht und geladen.
      </p>
    </Card>
  )
}
