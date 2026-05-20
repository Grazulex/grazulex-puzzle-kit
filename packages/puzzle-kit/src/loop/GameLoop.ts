type GameLoopOptions =
  | { mode: 'realtime'; ups?: number }
  | { mode: 'turnbased' }

export class GameLoop {
  private options: GameLoopOptions
  private _running = false
  private _paused = false
  private _rafId = 0
  private _lastTime = -1
  private _accumulator = 0
  private readonly _FIXED_DT: number

  onUpdate: ((dt: number) => void) | null = null
  onRender: ((alpha: number) => void) | null = null
  onTurn: ((action: Record<string, unknown>) => void) | null = null

  constructor(options: GameLoopOptions) {
    this.options = options
    this._FIXED_DT = options.mode === 'realtime' ? 1 / (options.ups ?? 60) : 0
  }

  start(): void {
    this._running = true
    this._paused = false

    if (this.options.mode === 'realtime') {
      this._lastTime = -1
      this._accumulator = 0
      this._rafId = requestAnimationFrame(this._tick)
    }
  }

  private _tick = (timestamp: number): void => {
    if (!this._running || this._paused) return

    if (this._lastTime === -1) {
      this._lastTime = timestamp
      this._rafId = requestAnimationFrame(this._tick)
      return
    }

    const delta = (timestamp - this._lastTime) / 1000
    this._lastTime = timestamp
    this._accumulator += delta

    while (this._accumulator >= this._FIXED_DT) {
      this.onUpdate?.(this._FIXED_DT)
      this._accumulator -= this._FIXED_DT
    }

    this.onRender?.(this._accumulator / this._FIXED_DT)
    this._rafId = requestAnimationFrame(this._tick)
  }

  stop(): void {
    this._running = false
    if (this._rafId !== 0) {
      cancelAnimationFrame(this._rafId)
      this._rafId = 0
    }
  }

  pause(): void {
    this._paused = true
    if (this._rafId !== 0) {
      cancelAnimationFrame(this._rafId)
      this._rafId = 0
    }
  }

  resume(): void {
    if (!this._running) return
    this._paused = false
    this._lastTime = -1
    this._rafId = requestAnimationFrame(this._tick)
  }

  submitAction(action: Record<string, unknown>): void {
    if (!this._running) return
    this.onTurn?.(action)
  }
}
