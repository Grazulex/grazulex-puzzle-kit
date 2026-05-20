import { Howl } from 'howler'
import type { EventBus } from '../event-bus/EventBus'

export interface AudioConfig {
  sounds: Record<string, { src: string; type: 'sfx' | 'music' }>
}

const VOLUME_KEY = 'grazulex-audio-volume'
const MUTE_KEY = 'grazulex-audio-muted'

export class AudioManager {
  private bus: EventBus
  private config: AudioConfig
  private volume: number
  private muted: boolean
  private activeMusic: Howl | null = null

  constructor({ bus, config }: { bus: EventBus; config: AudioConfig }) {
    this.bus = bus
    this.config = config
    this.volume = parseFloat(localStorage.getItem(VOLUME_KEY) ?? '1')
    this.muted = localStorage.getItem(MUTE_KEY) === 'true'
  }

  playMusic(name: string, options: { loop?: boolean; volume?: number } = {}): void {
    const def = this.config.sounds[name]
    if (!def) throw new Error(`Sound "${name}" not found`)
    this.activeMusic?.stop()
    this.activeMusic = new Howl({
      src: [def.src],
      loop: options.loop ?? true,
      volume: (options.volume ?? 1) * this.volume,
      mute: this.muted,
    })
    this.activeMusic.play()
    this.bus.emit('audio:music-started', name)
  }

  playSFX(name: string): void {
    const def = this.config.sounds[name]
    if (!def) throw new Error(`Sound "${name}" not found`)
    const sfx = new Howl({ src: [def.src], volume: this.volume, mute: this.muted })
    sfx.play()
  }

  fadeOut(_name: string, duration: number): void {
    if (this.activeMusic) {
      this.activeMusic.fade(this.volume, 0, duration)
    }
  }

  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value))
    localStorage.setItem(VOLUME_KEY, String(this.volume))
    this.bus.emit('audio:volume-changed', this.volume)
  }

  getVolume(): number {
    return this.volume
  }

  toggleMute(): void {
    this.muted = !this.muted
    localStorage.setItem(MUTE_KEY, String(this.muted))
    this.bus.emit('audio:mute-changed', this.muted)
  }

  isMuted(): boolean {
    return this.muted
  }
}
