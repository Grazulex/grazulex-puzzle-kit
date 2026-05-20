import { Howl } from 'howler'
import type { EventBus } from '../event-bus/EventBus'

export interface AudioConfig {
  sounds: Record<string, { src: string; type: 'sfx' | 'music' }>
}

const MASTER_VOLUME_KEY = 'grazulex-master-volume'
const MUSIC_VOLUME_KEY = 'grazulex-music-volume'
const SFX_VOLUME_KEY = 'grazulex-sfx-volume'
const MUTE_KEY = 'grazulex-audio-muted'

export class AudioManager {
  private bus: EventBus
  private config: AudioConfig
  private masterVolume: number
  private musicVolume: number
  private sfxVolume: number
  private muted: boolean
  private activeMusic: Howl | null = null

  constructor({ bus, config }: { bus: EventBus; config: AudioConfig }) {
    this.bus = bus
    this.config = config
    this.masterVolume = parseFloat(localStorage.getItem(MASTER_VOLUME_KEY) ?? '1')
    this.musicVolume = parseFloat(localStorage.getItem(MUSIC_VOLUME_KEY) ?? '0.8')
    this.sfxVolume = parseFloat(localStorage.getItem(SFX_VOLUME_KEY) ?? '1')
    this.muted = localStorage.getItem(MUTE_KEY) === 'true'
  }

  private effectiveVolume(type: 'music' | 'sfx'): number {
    const typeVolume = type === 'music' ? this.musicVolume : this.sfxVolume
    return this.muted ? 0 : this.masterVolume * typeVolume
  }

  playMusic(name: string, options: { loop?: boolean } = {}): void {
    const def = this.config.sounds[name]
    if (!def) throw new Error(`Sound "${name}" not found`)
    this.activeMusic?.stop()
    this.activeMusic = new Howl({
      src: [def.src],
      loop: options.loop ?? true,
      volume: this.effectiveVolume('music'),
    })
    this.activeMusic.play()
    this.bus.emit('audio:music-started', name)
  }

  playSFX(name: string): void {
    const def = this.config.sounds[name]
    if (!def) throw new Error(`Sound "${name}" not found`)
    const sfx = new Howl({ src: [def.src], volume: this.effectiveVolume('sfx') })
    sfx.play()
  }

  fadeOut(_name: string, duration: number): void {
    if (this.activeMusic) {
      this.activeMusic.fade(this.effectiveVolume('music'), 0, duration)
    }
  }

  setMasterVolume(value: number): void {
    this.masterVolume = Math.max(0, Math.min(1, value))
    localStorage.setItem(MASTER_VOLUME_KEY, String(this.masterVolume))
    this.bus.emit('audio:volume-changed', { master: this.masterVolume })
  }

  getMasterVolume(): number { return this.masterVolume }

  setMusicVolume(value: number): void {
    this.musicVolume = Math.max(0, Math.min(1, value))
    localStorage.setItem(MUSIC_VOLUME_KEY, String(this.musicVolume))
    this.bus.emit('audio:volume-changed', { music: this.musicVolume })
  }

  getMusicVolume(): number { return this.musicVolume }

  setSFXVolume(value: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, value))
    localStorage.setItem(SFX_VOLUME_KEY, String(this.sfxVolume))
    this.bus.emit('audio:volume-changed', { sfx: this.sfxVolume })
  }

  getSFXVolume(): number { return this.sfxVolume }

  toggleMute(): void {
    this.muted = !this.muted
    localStorage.setItem(MUTE_KEY, String(this.muted))
    this.bus.emit('audio:mute-changed', this.muted)
  }

  isMuted(): boolean { return this.muted }
}
