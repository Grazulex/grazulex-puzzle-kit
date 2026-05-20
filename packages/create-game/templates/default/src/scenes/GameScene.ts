import type { Scene } from '@grazulex/puzzle-kit'

export class GameScene implements Scene {
  private el: HTMLElement

  constructor() {
    this.el = document.getElementById('app')!
  }

  onEnter(_params?: Record<string, unknown>): void {
    this.el.innerHTML = `
      <div style="text-align:center;padding:2rem">
        <h2>En jeu</h2>
        <p>À toi de jouer !</p>
      </div>
    `
  }

  onExit(): void {
    this.el.innerHTML = ''
  }

  update(_dt: number): void {}
  render(): void {}
}
