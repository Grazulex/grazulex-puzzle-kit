import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameLoop } from './GameLoop'

// --- Helpers RAF mock ---
let rafCallbacks: Map<number, FrameRequestCallback>
let rafCounter: number
let currentTime: number

function setupRafMock(): void {
  rafCallbacks = new Map()
  rafCounter = 0
  currentTime = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    const id = ++rafCounter
    rafCallbacks.set(id, cb)
    return id
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    rafCallbacks.delete(id)
  })
}

// Avance le temps de `ms` ms et fire tous les RAF en attente (une seule vague).
function tick(ms: number): void {
  currentTime += ms
  const snapshot = new Map(rafCallbacks)
  rafCallbacks.clear()
  for (const cb of snapshot.values()) {
    cb(currentTime)
  }
}

beforeEach(() => {
  setupRafMock()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('GameLoop - mode turnbased', () => {
  it('onTurn est appelé avec l\'action soumise', () => {
    const loop = new GameLoop({ mode: 'turnbased' })
    const handler = vi.fn()
    loop.onTurn = handler
    loop.start()
    loop.submitAction({ type: 'move', target: 'A3' })
    expect(handler).toHaveBeenCalledWith({ type: 'move', target: 'A3' })
  })

  it('submitAction ne fait rien si onTurn n\'est pas défini', () => {
    const loop = new GameLoop({ mode: 'turnbased' })
    loop.start()
    expect(() => loop.submitAction({ type: 'move' })).not.toThrow()
  })

  it('submitAction ne fait rien après stop()', () => {
    const loop = new GameLoop({ mode: 'turnbased' })
    const handler = vi.fn()
    loop.onTurn = handler
    loop.start()
    loop.stop()
    loop.submitAction({ type: 'move' })
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('GameLoop - mode realtime', () => {
  it('onUpdate est appelé avec dt fixe (1/ups)', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    const updateHandler = vi.fn()
    loop.onUpdate = updateHandler
    loop.onRender = vi.fn()
    loop.start()
    tick(16)  // init : _lastTime = 16, pas d'update
    tick(16)  // accumulator = 0.016 < 1/60 = 0.01667, pas encore
    tick(16)  // accumulator = 0.032 >= 0.01667 → onUpdate déclenché
    expect(updateHandler).toHaveBeenCalled()
    const dt = updateHandler.mock.calls[0][0] as number
    expect(dt).toBeCloseTo(1 / 60, 5)
  })

  it('onRender est appelé avec alpha ∈ [0, 1]', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    loop.onUpdate = vi.fn()
    const renderHandler = vi.fn()
    loop.onRender = renderHandler
    loop.start()
    tick(16)
    tick(16)
    tick(16)
    expect(renderHandler).toHaveBeenCalled()
    const alpha = renderHandler.mock.calls[0][0] as number
    expect(alpha).toBeGreaterThanOrEqual(0)
    expect(alpha).toBeLessThanOrEqual(1)
  })

  it('pause() annule le RAF et arrête les appels à onUpdate', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    const handler = vi.fn()
    loop.onUpdate = handler
    loop.onRender = vi.fn()
    loop.start()
    tick(16)
    tick(16)
    tick(16)  // au moins un update
    loop.pause()
    const countAtPause = handler.mock.calls.length
    tick(100)  // aucun RAF en attente → rien ne se passe
    tick(100)
    expect(handler.mock.calls.length).toBe(countAtPause)
  })

  it('resume() reprend les appels après pause() sans saut de dt', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    const handler = vi.fn()
    loop.onUpdate = handler
    loop.onRender = vi.fn()
    loop.start()
    tick(16)  // init
    tick(16)
    tick(16)  // premier update
    loop.pause()
    loop.resume()
    tick(16)  // ré-init après resume (_lastTime = -1 → pas d'update ce tick)
    tick(16)
    tick(16)  // update avec FIXED_DT, pas de gros saut
    expect(handler.mock.calls.length).toBeGreaterThan(1)
    // Tous les dt doivent être exactement FIXED_DT (1/60), pas un saut de 200ms
    for (const [dt] of handler.mock.calls) {
      expect(dt as number).toBeCloseTo(1 / 60, 5)
    }
  })

  it('stop() annule le RAF et arrête la boucle', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    const handler = vi.fn()
    loop.onUpdate = handler
    loop.onRender = vi.fn()
    loop.start()
    tick(16)
    tick(16)
    tick(16)
    loop.stop()
    const countAtStop = handler.mock.calls.length
    tick(100)
    expect(handler.mock.calls.length).toBe(countAtStop)
  })
})
