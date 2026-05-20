export interface Scene {
  onEnter(params?: Record<string, unknown>): void
  onExit(): void
  update(dt: number): void
  render(): void
}
