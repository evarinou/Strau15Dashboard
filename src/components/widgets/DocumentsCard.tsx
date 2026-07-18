import { FileText, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { useDocuments } from '../../hooks/useBff'

// Letzte Paperless-Dokumente — bewusst read-only: nur ansehen, keine Aktionen.
export function DocumentsCard() {
  const { data } = useDocuments(5)

  if (!data) return null

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Letzte Dokumente</CardTitle>
        <a
          href={data.baseUrl}
          target="_blank"
          rel="noreferrer"
          className="text-text-secondary hover:text-accent transition-colors"
          title="Paperless öffnen"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </CardHeader>
      {data.documents.length === 0 ? (
        <p className="text-sm text-text-secondary">Keine Dokumente vorhanden.</p>
      ) : (
        <ul className="space-y-2.5">
          {data.documents.map((doc) => (
            <li key={doc.id} className="min-w-0">
              <a
                href={`${data.baseUrl}/documents/${doc.id}/details`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 min-w-0 group"
              >
                <img
                  src={`/api/documents/${doc.id}/thumb`}
                  alt=""
                  loading="lazy"
                  className="w-9 h-11 object-cover rounded border border-border flex-shrink-0 bg-surface-hover"
                  onError={(e) => {
                    // Thumbnail nicht verfügbar → generisches Icon zeigen
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
                <FileText className="w-5 h-5 text-text-secondary hidden flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate group-hover:text-accent-soft transition-colors">
                    {doc.title}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {new Date(doc.created).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
