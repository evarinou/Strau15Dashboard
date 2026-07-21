import { useState } from 'react'
import { Lightbulb, Music4, Play, Check, X } from 'lucide-react'
import { GlassPanel } from '../components/ui/GlassPanel'
import { MeshTile } from '../components/ui/MeshTile'
import { IconButton } from '../components/ui/IconButton'
import { Button } from '../components/ui/Button'
import { Slider } from '../components/ui/Slider'
import { Toggle } from '../components/ui/Toggle'
import { useDaylightPhase } from '../contexts/DaylightContext'
import type { DaylightPhase } from '../lib/daylight'

/**
 * Musterseite für die Designabnahme — ersetzt das fehlende Storybook.
 * Zeigt alle Primitives, beide Textgründe und alle fünf Tagphasen auf
 * einem Screenshot. Erreichbar unter /styleguide.
 */

const phases: { id: DaylightPhase; label: string }[] = [
  { id: 'daemmerung', label: 'Dämmerung' },
  { id: 'morgen', label: 'Morgen' },
  { id: 'tag', label: 'Tag' },
  { id: 'abend', label: 'Abend' },
  { id: 'nacht', label: 'Nacht' },
]

const seeds = [
  'wohnzimmer', 'kuche', 'schlafzimmer', 'bad',
  'bucherzimmer', 'esszimmer', 'ankleide', 'lukas_buro',
  '3d_drucker_zimmer', 'werkstatt', 'innenhof', 'musik',
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
        {title}
      </h2>
      {children}
    </section>
  )
}

export function Styleguide() {
  const phase = useDaylightPhase()
  const [demo, setDemo] = useState(55)
  const [on, setOn] = useState(true)

  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h1 className="font-display font-extrabold tracking-[-0.03em] text-ink text-4xl lg:text-5xl">
          Musterbogen
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Aktuelle Tagphase: <strong className="text-ink">{phase}</strong>
        </p>
      </header>

      <Section title="Tagphasen — der Grund folgt der Sonne">
        <div className="flex flex-wrap gap-2">
          {phases.map(({ id, label }) => (
            <a
              key={id}
              href={`?daylight=${id}`}
              className={
                'px-4 py-2 rounded-full text-sm transition-colors ' +
                (phase === id
                  ? 'glass-l3 text-ink font-semibold shadow-pill'
                  : 'text-text-secondary hover:bg-white/35 hover:text-ink')
              }
            >
              {label}
            </a>
          ))}
          <a
            href="?"
            className="px-4 py-2 rounded-full text-sm text-text-secondary hover:bg-white/35 hover:text-ink"
          >
            Automatik
          </a>
        </div>
      </Section>

      <Section title="Glasstufen">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {([1, 2, 3, 4] as const).map((level) => (
            <GlassPanel key={level} level={level} radius="tile">
              <p className="font-display font-bold text-lg text-ink">Stufe {level}</p>
              <p className="text-sm text-text-secondary">Fließtext</p>
              <p className="text-xs text-text-muted mt-1">Meta-Angabe</p>
            </GlassPanel>
          ))}
        </div>
      </Section>

      <Section title="Textstufen auf Glas">
        <GlassPanel>
          <p className="font-display font-extrabold text-3xl text-ink">Überschrift in Tinte</p>
          <p className="text-text-primary mt-2">
            Fließtext trägt die eigentliche Information und muss auf jeder Mesh-Region lesbar
            bleiben.
          </p>
          <p className="text-text-secondary text-sm mt-2">Label und sekundäre Angaben</p>
          <p className="text-text-muted text-xs mt-1">Zeitstempel, Fußnoten</p>
        </GlassPanel>
      </Section>

      <Section title="Status">
        <GlassPanel>
          <div className="flex flex-wrap gap-4 items-center">
            {[
              ['Erledigt', 'text-success', 'bg-success-fill'],
              ['Achtung', 'text-warning', 'bg-warning-fill'],
              ['Störung', 'text-danger', 'bg-danger-fill'],
              ['Aktion', 'text-accent', 'bg-accent'],
            ].map(([label, text, fill]) => (
              <span key={label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${fill}`} />
                <span className={`text-sm font-medium ${text}`}>{label}</span>
              </span>
            ))}
          </div>
        </GlassPanel>
      </Section>

      <Section title="Bedienelemente">
        <GlassPanel>
          <div className="flex flex-wrap gap-3 items-center">
            <Button>Primär</Button>
            <Button variant="secondary">Sekundär</Button>
            <Button variant="ghost">Unauffällig</Button>
            <Button variant="danger">Löschen</Button>
            <IconButton icon={<Play className="w-4 h-4" />} label="Abspielen" />
            <IconButton icon={<Check className="w-4 h-4" />} label="Bestätigen" variant="solid" />
            <IconButton icon={<X className="w-4 h-4" />} label="Schließen" variant="ghost" />
          </div>
        </GlassPanel>
      </Section>

      <Section title="Regler und Schalter">
        <GlassPanel>
          <div className="grid sm:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              {/* Mehrere Regler nebeneinander: jeder muss seinen eigenen
                  Griffschatten behalten — genau das ging vorher schief. */}
              <Slider value={demo} onChange={setDemo} />
              <Slider value={15} onChange={() => {}} />
              <Slider value={90} onChange={() => {}} />
            </div>
            <div className="flex items-center gap-4">
              <Toggle checked={on} onChange={setOn} size="sm" />
              <Toggle checked={on} onChange={setOn} />
              <Toggle checked={on} onChange={setOn} size="lg" />
              <Toggle checked={false} disabled />
            </div>
          </div>
        </GlassPanel>
      </Section>

      <Section title="Kacheln — jeder Raum hat für immer seine Farbe">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {seeds.map((seed) => (
            <MeshTile key={seed} seed={seed} label={seed} sublabel="Verlauf aus dem Seed" />
          ))}
        </div>
      </Section>

      <Section title="Kachel-Sonderfälle">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MeshTile
            seed="wohnzimmer"
            label="Mit Symbol"
            icon={<Lightbulb className="w-4 h-4" />}
            aspect="square"
          />
          <MeshTile seed="musik" label="Aktiv" icon={<Music4 className="w-4 h-4" />} active aspect="square" />
          <MeshTile seed="bad" label="Ohne Knopf" arrow={false} aspect="square" />
          <MeshTile seed="werkstatt" label="Gesperrt" disabled aspect="square" />
        </div>
      </Section>
    </div>
  )
}
