import { Lightbulb, LightbulbOff } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LightWidget, SwitchLightWidget } from '../components/widgets'
import { useHA } from '../contexts/HomeAssistantContext'
import { LIGHT_ENTITIES, SWITCH_LIGHT_ENTITIES, SCRIPTS } from '../config/entities'

export function Lights() {
  const { entities, callService } = useHA()

  // Count active lights (both light.* and switch lights); unavailable Geräte zählen nicht zur Basis
  const lights = LIGHT_ENTITIES.map((id) => entities.get(id)).filter(
    (l) => l && l.state !== 'unavailable'
  )
  const switchLights = SWITCH_LIGHT_ENTITIES.map((s) => entities.get(s.id)).filter(
    (l) => l && l.state !== 'unavailable'
  )

  const activeLights = lights.filter((l) => l?.state === 'on').length
  const activeSwitchLights = switchLights.filter((l) => l?.state === 'on').length
  const totalActive = activeLights + activeSwitchLights
  const totalCount = lights.length + switchLights.length

  const turnAllOn = () => {
    callService({
      domain: 'script',
      service: 'turn_on',
      target: { entity_id: SCRIPTS.alleHauptlichterEin },
    })
  }

  const turnAllOff = () => {
    callService({
      domain: 'script',
      service: 'turn_on',
      target: { entity_id: SCRIPTS.alleHauptlichterAus },
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
