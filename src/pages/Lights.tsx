import { Lightbulb, LightbulbOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LightWidget, SwitchLightWidget } from '../components/widgets'
import { useHA } from '../contexts/HomeAssistantContext'

// Echte light.* Entities
const LIGHT_ENTITIES = [
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
  'light.a1_03919d4b2001225_druckraumbeleuchtung',
]

// Switch Entities die als Lichter fungieren
const SWITCH_LIGHT_ENTITIES: { id: string; label: string }[] = [
  { id: 'switch.sonoff_ankleide_ankleide', label: 'Ankleide' },
  { id: 'switch.sonoff_esszimmer_esszimmer', label: 'Esszimmer' },
  { id: 'switch.sonoff_kueche_kueche', label: 'Küche' },
  { id: 'switch.sonoff_schlafzimmer_schlafzimmer', label: 'Schlafzimmer Decke' },
  { id: 'switch.0xb4e3f9fffe7cb0ae', label: 'Treppenhaus' },
]

export function Lights() {
  const { entities, callService } = useHA()

  // Count active lights (both light.* and switch lights)
  const lights = LIGHT_ENTITIES.map((id) => entities.get(id)).filter(Boolean)
  const switchLights = SWITCH_LIGHT_ENTITIES.map((s) => entities.get(s.id)).filter(Boolean)

  const activeLights = lights.filter((l) => l?.state === 'on').length
  const activeSwitchLights = switchLights.filter((l) => l?.state === 'on').length
  const totalActive = activeLights + activeSwitchLights
  const totalCount = lights.length + switchLights.length

  const turnAllOn = () => {
    callService({
      domain: 'script',
      service: 'turn_on',
      target: { entity_id: 'script.alle_hauptlichter_ein' },
    })
  }

  const turnAllOff = () => {
    callService({
      domain: 'script',
      service: 'turn_on',
      target: { entity_id: 'script.alle_hauptlichter_aus' },
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lichter</h1>
          <p className="text-text-secondary">{totalActive} von {totalCount} eingeschaltet</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={turnAllOn}>
            <Lightbulb className="w-4 h-4 mr-2" />
            Alle an
          </Button>
          <Button variant="secondary" onClick={turnAllOff}>
            <LightbulbOff className="w-4 h-4 mr-2" />
            Alle aus
          </Button>
        </div>
      </div>

      {/* Switch-based Lights (Hauptlichter) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Hauptlichter</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SWITCH_LIGHT_ENTITIES.map(({ id, label }) => (
            <SwitchLightWidget key={id} entityId={id} label={label} />
          ))}
        </div>
      </section>

      {/* Regular Lights (Nebenlichter) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Nebenlichter</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LIGHT_ENTITIES.map((entityId) => (
            <LightWidget key={entityId} entityId={entityId} showSlider />
          ))}
        </div>
      </section>
    </div>
  )
}
