import type { EventBus } from '../event-bus/EventBus'
import type { Scene } from './Scene'

type SceneConstructor = new () => Scene

interface SceneManagerOptions {
  bus: EventBus
  scenes: Record<string, SceneConstructor>
  container?: HTMLElement
}

export type TransitionOptions =
  | { transition: 'fade'; duration: number }
  | { transition: 'none' }

export class SceneManager {
  private bus: EventBus
  private registry: Record<string, SceneConstructor>
  private stack: Array<{ name: string; instance: Scene }> = []
  private _overlay: HTMLDivElement | null = null
  private _transitionId = 0

  constructor({ bus, scenes, container }: SceneManagerOptions) {
    this.bus = bus
    this.registry = { ...scenes }
    if (container) {
      const overlay = document.createElement('div')
      overlay.style.position = 'absolute'
      overlay.style.inset = '0'
      overlay.style.background = '#000'
      overlay.style.opacity = '0'
      overlay.style.pointerEvents = 'none'
      overlay.style.zIndex = '9999'
      container.appendChild(overlay)
      this._overlay = overlay
    }
  }

  register(name: string, ctor: SceneConstructor): void {
    this.registry[name] = ctor
  }

  goto(name: string, params?: Record<string, unknown>, _transition?: TransitionOptions): void {
    if (!this.registry[name]) {
      throw new Error(`Scene "${name}" not registered`)
    }
    this._doGoto(name, params)
  }

  back(_transition?: TransitionOptions): void {
    if (this.stack.length < 2) return
    this._doBack()
  }

  current(): Scene | null {
    return this.stack[this.stack.length - 1]?.instance ?? null
  }

  private _doGoto(name: string, params?: Record<string, unknown>): void {
    this.stack[this.stack.length - 1]?.instance.onExit()
    const instance = new this.registry[name]()
    this.stack.push({ name, instance })
    instance.onEnter(params)
    this.bus.emit('scene:changed', name)
  }

  private _doBack(): void {
    this.stack[this.stack.length - 1].instance.onExit()
    this.stack.pop()
    const prev = this.stack[this.stack.length - 1]
    prev.instance.onEnter()
    this.bus.emit('scene:changed', prev.name)
  }
}
