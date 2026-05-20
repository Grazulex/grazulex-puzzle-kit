import { describe, it, expect, vi } from 'vitest'
import { EventBus } from './EventBus'

describe('EventBus', () => {
  it('appelle le handler quand un événement est émis', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('test', handler)
    bus.emit('test', 42)
    expect(handler).toHaveBeenCalledWith(42)
  })

  it('ne appelle pas le handler après off()', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('test', handler)
    bus.off('test', handler)
    bus.emit('test', 42)
    expect(handler).not.toHaveBeenCalled()
  })

  it('appelle plusieurs handlers sur le même événement', () => {
    const bus = new EventBus()
    const h1 = vi.fn()
    const h2 = vi.fn()
    bus.on('test', h1)
    bus.on('test', h2)
    bus.emit('test', 'hello')
    expect(h1).toHaveBeenCalledWith('hello')
    expect(h2).toHaveBeenCalledWith('hello')
  })

  it('n\'appelle pas les handlers d\'autres événements', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('other', handler)
    bus.emit('test', 42)
    expect(handler).not.toHaveBeenCalled()
  })

  it('émet sans data quand aucun argument passé', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.on('test', handler)
    bus.emit('test')
    expect(handler).toHaveBeenCalledWith(undefined)
  })
})
