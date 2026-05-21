import type { EventBus } from '../event-bus/EventBus'

export type DebugLogger = (event: string, payload: unknown) => void

export interface DebugManagerOptions {
  bus: EventBus
  enabled: boolean
  channels: string[]
  loggers?: Partial<Record<string, DebugLogger>>
}

export class DebugManager {
  private _bus: EventBus | null = null
  private _handler: ((event: string, payload: unknown) => void) | null = null

  constructor({ bus, enabled, channels, loggers }: DebugManagerOptions) {
    if (!enabled) return
    let _lastTime = Date.now()
    this._bus = bus
    this._handler = (event: string, payload: unknown) => {
      const channel = event.includes(':') ? event.split(':')[0] : event
      if (!channels.includes(channel)) return
      const custom = loggers?.[channel]
      if (custom) {
        custom(event, payload)
      } else {
        const now = Date.now()
        const delta = now - _lastTime
        _lastTime = now
        console.log(`[debug][${channel}] ${event} ${JSON.stringify(payload)}  +${delta}ms`)
      }
    }
    bus.onAny(this._handler)
  }

  destroy(): void {
    if (this._handler && this._bus) {
      this._bus.offAny(this._handler)
    }
    this._handler = null
    this._bus = null
  }
}
