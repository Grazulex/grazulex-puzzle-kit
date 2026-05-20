import type { Scene, EventBus } from '@grazulex/puzzle-kit'

export class MenuScene implements Scene {
  private bus: EventBus
  private el: HTMLElement

  constructor(bus: EventBus) {
    this.bus = bus
    this.el = document.getElementById('app')!
  }

  onEnter(): void {
    this.el.innerHTML = `
      <div style="text-align:center;padding:2rem">
        <h1>Mon Jeu</h1>
        <button id="start-btn" style="margin-top:2rem;padding:1rem 2rem;font-size:1.2rem;cursor:pointer">
          Jouer
        </button>
      </div>
    `
    document.getElementById('start-btn')!.addEventListener('click', () => {
      this.bus.emit('scene:goto', 'game')
    })
  }

  onExit(): void {
    this.el.innerHTML = ''
  }

  update(_dt: number): void {}
  render(): void {}
}
