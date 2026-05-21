import type { EventBus } from '../event-bus/EventBus'

export class InputManager {
  private bus: EventBus
  private bindings = new Map<string, string>()
  private _mouseStart: { x: number; y: number } | null = null
  private _dragging = false
  private _touchStart: { x: number; y: number } | null = null

  constructor({ bus }: { bus: EventBus }) {
    this.bus = bus
    document.addEventListener('keydown', this._onKeyDown)
    document.addEventListener('mousedown', this._onMouseDown)
    document.addEventListener('mousemove', this._onMouseMove)
    document.addEventListener('mouseup', this._onMouseUp)
    document.addEventListener('touchstart', this._onTouchStart)
    document.addEventListener('touchend', this._onTouchEnd)
  }

  bind(action: string, keys: string[]): void {
    for (const key of keys) {
      this.bindings.set(key, action)
    }
  }

  destroy(): void {
    document.removeEventListener('keydown', this._onKeyDown)
    document.removeEventListener('mousedown', this._onMouseDown)
    document.removeEventListener('mousemove', this._onMouseMove)
    document.removeEventListener('mouseup', this._onMouseUp)
    document.removeEventListener('touchstart', this._onTouchStart)
    document.removeEventListener('touchend', this._onTouchEnd)
  }

  private _onKeyDown = (e: KeyboardEvent): void => {
    const action = this.bindings.get(e.key)
    if (!action) return
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
      e.preventDefault()
    }
    this.bus.emit('input:action', { name: action })
  }

  private _onMouseDown = (_e: MouseEvent): void => {}
  private _onMouseMove = (_e: MouseEvent): void => {}
  private _onMouseUp = (_e: MouseEvent): void => {}
  private _onTouchStart = (_e: Event): void => {}
  private _onTouchEnd = (_e: Event): void => {}
}
