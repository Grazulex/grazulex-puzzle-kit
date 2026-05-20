import type { EventBus } from '../event-bus/EventBus'

interface SaveSystemOptions {
  key?: string
  version: number
  bus: EventBus
}

interface SaveEnvelope<T> {
  version: number
  data: T
}

export class SaveSystem<T> {
  private key: string
  private version: number
  private bus: EventBus
  onVersionMismatch: ((oldVersion: number, currentVersion: number, data: unknown) => T) | null = null

  constructor({ key = 'grazulex-save', version, bus }: SaveSystemOptions) {
    this.key = key
    this.version = version
    this.bus = bus
  }

  snapshot(state: T): void {
    const envelope: SaveEnvelope<T> = { version: this.version, data: state }
    const store = (globalThis as any).localStorage
    if (store) {
      store.setItem(this.key, JSON.stringify(envelope))
    }
  }

  restore(): T | null {
    const store = (globalThis as any).localStorage
    if (!store) return null

    const raw = store.getItem(this.key)
    if (!raw) return null

    const envelope = JSON.parse(raw) as SaveEnvelope<unknown>

    if (envelope.version !== this.version) {
      if (this.onVersionMismatch) {
        const result = this.onVersionMismatch(envelope.version, this.version, envelope.data)
        this.bus.emit('save:restored', result)
        return result
      }
      return null
    }

    this.bus.emit('save:restored', envelope.data)
    return envelope.data as T
  }

  clear(): void {
    const store = (globalThis as any).localStorage
    if (store) {
      store.removeItem(this.key)
    }
    this.bus.emit('save:cleared')
  }
}
