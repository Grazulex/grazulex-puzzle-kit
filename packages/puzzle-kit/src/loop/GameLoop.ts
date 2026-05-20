type GameLoopOptions =
  | { mode: 'realtime'; ups?: number }
  | { mode: 'turnbased' }

export class GameLoop {
  private options: GameLoopOptions
  private running = false
  private paused = false
  private intervalId: ReturnType<typeof setInterval> | null = null
  private lastTime = 0

  onUpdate: ((dt: number) => void) | null = null
  onRender: ((alpha: number) => void) | null = null
  onTurn: ((action: Record<string, unknown>) => void) | null = null

  constructor(options: GameLoopOptions) {
    this.options = options
  }

  start(): void {
    this.running = true
    this.paused = false

    if (this.options.mode === 'realtime') {
      const ups = this.options.ups ?? 60
      const step = 1000 / ups
      this.lastTime = Date.now()
      this.intervalId = setInterval(() => {
        if (this.paused) return
        const now = Date.now()
        const dt = (now - this.lastTime) / 1000
        this.lastTime = now
        this.onUpdate?.(dt)
        this.onRender?.(1)
      }, step)
    }
  }

  stop(): void {
    this.running = false
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    if (!this.running) return
    this.paused = false
    this.lastTime = Date.now()
  }

  submitAction(action: Record<string, unknown>): void {
    if (!this.running) return
    this.onTurn?.(action)
  }
}
