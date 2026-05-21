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

  private _onMouseDown = (e: MouseEvent): void => {
    this._mouseStart = { x: e.clientX, y: e.clientY }
    this._dragging = false
  }

  private _onMouseMove = (e: MouseEvent): void => {
    if (!this._mouseStart || this._dragging) return
    const dx = e.clientX - this._mouseStart.x
    const dy = e.clientY - this._mouseStart.y
    if (Math.sqrt(dx * dx + dy * dy) > 10) {
      this._dragging = true
      this.bus.emit('input:drag-start', { x: this._mouseStart.x, y: this._mouseStart.y })
    }
  }

  private _onMouseUp = (e: MouseEvent): void => {
    if (!this._mouseStart) return
    if (this._dragging) {
      this.bus.emit('input:drag-end', { x: e.clientX, y: e.clientY })
    } else {
      this.bus.emit('input:click', { x: e.clientX, y: e.clientY })
    }
    this._mouseStart = null
    this._dragging = false
  }
  private _onTouchStart = (e: Event): void => {
    const touch = (e as TouchEvent).changedTouches[0]
    if (!touch) return
    this._touchStart = { x: touch.clientX, y: touch.clientY }
  }

  private _onTouchEnd = (e: Event): void => {
    if (!this._touchStart) return
    const touch = (e as TouchEvent).changedTouches[0]
    if (!touch) return
    const dx = touch.clientX - this._touchStart.x
    const dy = touch.clientY - this._touchStart.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist < 10) {
      this.bus.emit('input:click', { x: touch.clientX, y: touch.clientY })
    } else {
      const absX = Math.abs(dx)
      const absY = Math.abs(dy)
      const arrowKey = absX >= absY
        ? (dx < 0 ? 'ArrowLeft' : 'ArrowRight')
        : (dy < 0 ? 'ArrowUp' : 'ArrowDown')
      const action = this.bindings.get(arrowKey)
      if (action) {
        this.bus.emit('input:action', { name: action })
      }
      this.bus.emit('input:drag-start', { x: this._touchStart.x, y: this._touchStart.y })
      this.bus.emit('input:drag-end', { x: touch.clientX, y: touch.clientY })
    }
    this._touchStart = null
  }
}
