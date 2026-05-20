type EventMap = Record<string, unknown>
type Handler<T = unknown> = (data: T) => void

export class EventBus<T extends EventMap = EventMap> {
  private listeners = new Map<string, Set<Handler>>()

  on<K extends keyof T & string>(event: K, handler: (data: T[K]) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as Handler)
  }

  off<K extends keyof T & string>(event: K, handler: (data: T[K]) => void): void {
    this.listeners.get(event)?.delete(handler as Handler)
  }

  emit<K extends keyof T & string>(event: K, data?: T[K]): void {
    this.listeners.get(event)?.forEach(h => h(data))
  }
}
