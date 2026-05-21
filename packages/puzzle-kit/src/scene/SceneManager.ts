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

  goto(name: string, params?: Record<string, unknown>, transition?: TransitionOptions): void {
    if (!this.registry[name]) {
      throw new Error(`Scene "${name}" not registered`)
    }
    if (transition?.transition === 'fade' && this._overlay) {
      this._runFade(transition.duration, () => {
        this.stack[this.stack.length - 1]?.instance.onExit()
        const instance = new this.registry[name]()
        this.stack.push({ name, instance })
        instance.onEnter(params)
      }, name)
    } else {
      this._doGoto(name, params)
    }
  }

  back(transition?: TransitionOptions): void {
    if (this.stack.length < 2) return
    if (transition?.transition === 'fade' && this._overlay) {
      const prevName = this.stack[this.stack.length - 2].name
      this._runFade(transition.duration, () => {
        this.stack[this.stack.length - 1].instance.onExit()
        this.stack.pop()
        this.stack[this.stack.length - 1].instance.onEnter()
      }, prevName)
    } else {
      this._doBack()
    }
  }

  replace(name: string, params?: Record<string, unknown>, transition?: TransitionOptions): void {
    if (!this.registry[name]) throw new Error(`Scene "${name}" not registered`)
    if (transition?.transition === 'fade' && this._overlay) {
      this._runFade(transition.duration, () => {
        const current = this.stack[this.stack.length - 1]
        current?.instance.onExit()
        const instance = new this.registry[name]()
        if (this.stack.length > 0) {
          this.stack[this.stack.length - 1] = { name, instance }
        } else {
          this.stack.push({ name, instance })
        }
        instance.onEnter(params)
      }, name)
    } else {
      this._doReplace(name, params)
    }
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

  private _doReplace(name: string, params?: Record<string, unknown>): void {
    const current = this.stack[this.stack.length - 1]
    current?.instance.onExit()
    const instance = new this.registry[name]()
    if (this.stack.length > 0) {
      this.stack[this.stack.length - 1] = { name, instance }
    } else {
      this.stack.push({ name, instance })
    }
    instance.onEnter(params)
    this.bus.emit('scene:changed', name)
  }

  private _runFade(duration: number, onSwitch: () => void, emitName: string): void {
    this._transitionId++
    const id = this._transitionId
    const half = Math.floor(duration / 2)
    const overlay = this._overlay!
    overlay.style.transition = 'none'
    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
    overlay.style.transition = `opacity ${half}ms ease`
    overlay.style.opacity = '1'
    overlay.style.pointerEvents = 'all'
    setTimeout(() => {
      if (this._transitionId !== id) return
      onSwitch()
      overlay.style.opacity = '0'
      setTimeout(() => {
        if (this._transitionId !== id) return
        overlay.style.pointerEvents = 'none'
        this.bus.emit('scene:changed', emitName)
      }, half)
    }, half)
  }
}
