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

// Mock localStorage (same pattern as SaveSystem.test.ts)
const createLocalStorageMock = () => {
  const store: { [key: string]: string } = {}
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

  it('setVolume() persiste en localStorage', async () => {
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    audio.setVolume(0.5)
    expect(localStorage.getItem('grazulex-audio-volume')).toBe('0.5')
  })

  it('restaure le volume depuis localStorage au démarrage', async () => {
    localStorage.setItem('grazulex-audio-volume', '0.3')
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    expect(audio.getVolume()).toBe(0.3)
  })

  it('lance une erreur si le son n\'existe pas', async () => {
    const { AudioManager } = await import('./AudioManager')
    const audio = new AudioManager({ bus: new EventBus(), config })
    expect(() => audio.playSFX('unknown')).toThrow('Sound "unknown" not found')
  })
})
