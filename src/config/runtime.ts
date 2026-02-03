// Runtime configuration that can be injected at container startup
// Falls back to Vite env vars for development

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      VITE_HA_URL?: string
      VITE_HA_WS_URL?: string
      VITE_HA_TOKEN?: string
      VITE_CHOREQUEST_URL?: string
      VITE_CHOREQUEST_TOKEN?: string
    }
  }
}

function getConfig(key: string): string {
  // First check runtime config (Docker)
  const runtimeValue = window.__RUNTIME_CONFIG__?.[key as keyof typeof window.__RUNTIME_CONFIG__]
  if (runtimeValue) {
    return runtimeValue
  }

  // Fall back to Vite env vars (development)
  return import.meta.env[key] || ''
}

export const config = {
  get HA_URL() {
    return getConfig('VITE_HA_URL') || 'http://strau15machine:8123'
  },
  get HA_WS_URL() {
    return getConfig('VITE_HA_WS_URL') || 'ws://strau15machine:8123/api/websocket'
  },
  get HA_TOKEN() {
    return getConfig('VITE_HA_TOKEN') || ''
  },
  get CHOREQUEST_URL() {
    return getConfig('VITE_CHOREQUEST_URL') || 'http://strau15machine:8007'
  },
  get CHOREQUEST_TOKEN() {
    return getConfig('VITE_CHOREQUEST_TOKEN') || ''
  },
}
