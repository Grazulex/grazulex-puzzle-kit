import type { EventBus } from '../event-bus/EventBus'
import type { Scene } from './Scene'

type SceneConstructor = new () => Scene

interface SceneManagerOptions {
  bus: EventBus
  scenes: Record<string, SceneConstructor>
}

export class SceneManager {
  private bus: EventBus
  private registry: Record<string, SceneConstructor>
  private stack: Array<{ name: string; instance: Scene }> = []

  constructor({ bus, scenes }: SceneManagerOptions) {
    this.bus = bus
    this.registry = { ...scenes }
  }

  register(name: string, ctor: SceneConstructor): void {
    this.registry[name] = ctor
  }

  goto(name: string, params?: Record<string, unknown>): void {
    if (!this.registry[name]) {
      throw new Error(`Scene "${name}" not registered`)
    }
    this.stack[this.stack.length - 1]?.instance.onExit()
    const instance = new this.registry[name]()
    this.stack.push({ name, instance })
    instance.onEnter(params)
    this.bus.emit('scene:changed', name)
  }

  back(): void {
    if (this.stack.length < 2) return
    this.stack[this.stack.length - 1].instance.onExit()
    this.stack.pop()
    const prev = this.stack[this.stack.length - 1]
    prev.instance.onEnter()
    this.bus.emit('scene:changed', prev.name)
  }

  current(): Scene | null {
    return this.stack[this.stack.length - 1]?.instance ?? null
  }
}
