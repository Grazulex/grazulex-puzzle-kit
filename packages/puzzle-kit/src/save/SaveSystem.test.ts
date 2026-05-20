import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../event-bus/EventBus'
import { SaveSystem } from './SaveSystem'

interface GameState {
  score: number
  level: number
}

// Mock localStorage
const createLocalStorageMock = () => {
  const store: { [key: string]: string } = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    },
  }
}

let localStorageMock: ReturnType<typeof createLocalStorageMock>

beforeEach(() => {
  localStorageMock = createLocalStorageMock()
  ;(globalThis as any).localStorage = localStorageMock
})

afterEach(() => {
  delete (globalThis as any).localStorage
})

const makeSystem = (version = 1) =>
  new SaveSystem<GameState>({ key: 'test-save', version, bus: new EventBus() })

describe('SaveSystem', () => {
  it('restore() retourne null si rien en localStorage', () => {
    const save = makeSystem()
    expect(save.restore()).toBeNull()
  })

  it('snapshot puis restore retourne l\'état d\'origine', () => {
    const save = makeSystem()
    save.snapshot({ score: 100, level: 3 })
    expect(save.restore()).toEqual({ score: 100, level: 3 })
  })

  it('clear() fait que restore() retourne null', () => {
    const save = makeSystem()
    save.snapshot({ score: 10, level: 1 })
    save.clear()
    expect(save.restore()).toBeNull()
  })

  it('restore() retourne null si la version est incompatible (sans handler)', () => {
    const save1 = makeSystem(1)
    save1.snapshot({ score: 50, level: 2 })

    const save2 = makeSystem(2)
    expect(save2.restore()).toBeNull()
  })

  it('onVersionMismatch est appelé avec les bonnes versions', () => {
    const save1 = makeSystem(1)
    save1.snapshot({ score: 50, level: 2 })

    const save2 = makeSystem(2)
    const migrated: GameState = { score: 50, level: 1 }
    save2.onVersionMismatch = (_old, _current) => migrated
    expect(save2.restore()).toEqual(migrated)
  })

  it('émet bus event "save:restored" au restore', () => {
    const bus = new EventBus()
    const save = new SaveSystem<GameState>({ key: 'test-save', version: 1, bus })
    save.snapshot({ score: 10, level: 1 })
    let emitted = false
    bus.on('save:restored', () => { emitted = true })
    save.restore()
    expect(emitted).toBe(true)
  })
})
