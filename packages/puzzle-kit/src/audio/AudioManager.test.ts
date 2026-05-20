import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../event-bus/EventBus'

vi.mock('howler', () => {
  const Howl = vi.fn().mockImplementation(() => ({
    play: vi.fn().mockReturnValue(1),
    stop: vi.fn(),
    volume: vi.fn(),
    fade: vi.fn(),
    loop: vi.fn(),
    playing: vi.fn().mockReturnValue(false),
  }))
  return { Howl }
})

const config = {
  sounds: {
    'main-theme': { src: 'audio/main-theme.mp3', type: 'music' as const },
    click: { src: 'audio/click.mp3', type: 'sfx' as const },
  },
}

const createLocalStorageMock = () => {
  const store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value.toString() },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(key => delete store[key]) },
  }
}

let localStorageMock: ReturnType<typeof createLocalStorageMock>

beforeEach(() => {
  localStorageMock = createLocalStorageMock()
  ;(globalThis as any).localStorage = localStorageMock
  vi.clearAllMocks()
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

describe('AudioManager', () => {
  it('playMusic() crée un Howl et joue en loop', async () => {
    const { Howl } = await import('howler')
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    audio.playMusic('main-theme', { loop: true })
    expect(Howl).toHaveBeenCalled()
  })

  it('playSFX() crée un Howl et joue', async () => {
    const { Howl } = await import('howler')
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    audio.playSFX('click')
    expect(Howl).toHaveBeenCalled()
  })

  it('toggleMute() inverse l\'état muet', async () => {
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    expect(audio.isMuted()).toBe(false)
    audio.toggleMute()
    expect(audio.isMuted()).toBe(true)
    audio.toggleMute()
    expect(audio.isMuted()).toBe(false)
  })

  it('setMasterVolume() persiste en localStorage', async () => {
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    audio.setMasterVolume(0.5)
    expect(localStorage.getItem('grazulex-master-volume')).toBe('0.5')
    expect(audio.getMasterVolume()).toBe(0.5)
  })

  it('setMusicVolume() persiste en localStorage', async () => {
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    audio.setMusicVolume(0.6)
    expect(localStorage.getItem('grazulex-music-volume')).toBe('0.6')
    expect(audio.getMusicVolume()).toBe(0.6)
  })

  it('setSFXVolume() persiste en localStorage', async () => {
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    audio.setSFXVolume(0.3)
    expect(localStorage.getItem('grazulex-sfx-volume')).toBe('0.3')
    expect(audio.getSFXVolume()).toBe(0.3)
  })

  it('restaure les 3 volumes depuis localStorage au démarrage', async () => {
    localStorage.setItem('grazulex-master-volume', '0.7')
    localStorage.setItem('grazulex-music-volume', '0.4')
    localStorage.setItem('grazulex-sfx-volume', '0.9')
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    expect(audio.getMasterVolume()).toBe(0.7)
    expect(audio.getMusicVolume()).toBe(0.4)
    expect(audio.getSFXVolume()).toBe(0.9)
  })

  it('lance une erreur si le son n\'existe pas', async () => {
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    expect(() => audio.playSFX('unknown')).toThrow('Sound "unknown" not found')
  })
})
