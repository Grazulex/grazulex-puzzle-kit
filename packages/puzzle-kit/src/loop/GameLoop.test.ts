import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameLoop } from './GameLoop'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
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
  it('onUpdate est appelé avec un dt > 0 après tick', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    const handler = vi.fn()
    loop.onUpdate = handler
    loop.onRender = vi.fn()
    loop.start()
    vi.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalled()
    const dt = handler.mock.calls[0][0] as number
    expect(dt).toBeGreaterThan(0)
  })

  it('pause() arrête les appels à onUpdate', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    const handler = vi.fn()
    loop.onUpdate = handler
    loop.onRender = vi.fn()
    loop.start()
    vi.advanceTimersByTime(50)
    loop.pause()
    const callsBefore = handler.mock.calls.length
    vi.advanceTimersByTime(100)
    expect(handler.mock.calls.length).toBe(callsBefore)
  })

  it('resume() reprend les appels après pause()', () => {
    const loop = new GameLoop({ mode: 'realtime', ups: 60 })
    const handler = vi.fn()
    loop.onUpdate = handler
    loop.onRender = vi.fn()
    loop.start()
    loop.pause()
    vi.advanceTimersByTime(100)
    loop.resume()
    vi.advanceTimersByTime(100)
    expect(handler).toHaveBeenCalled()
  })
})
