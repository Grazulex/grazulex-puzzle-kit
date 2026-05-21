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

  it('EventBus<T> — handler reçoit le bon type au runtime', () => {
    type Events = { 'score:updated': number; 'game:over': undefined }
    const bus = new EventBus<Events>()
    const handler = vi.fn()
    bus.on('score:updated', handler)
    bus.emit('score:updated', 99)
    expect(handler).toHaveBeenCalledWith(99)
  })

  it('EventBus<T> — plusieurs événements typés indépendants', () => {
    type Events = { 'a': string; 'b': number }
    const bus = new EventBus<Events>()
    const ha = vi.fn()
    const hb = vi.fn()
    bus.on('a', ha)
    bus.on('b', hb)
    bus.emit('a', 'hello')
    bus.emit('b', 42)
    expect(ha).toHaveBeenCalledWith('hello')
    expect(hb).toHaveBeenCalledWith(42)
  })

  it('onAny reçoit tous les events émis', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.onAny(handler)
    bus.emit('test', 42)
    expect(handler).toHaveBeenCalledWith('test', 42)
  })

  it('onAny ne reçoit pas les events émis avant inscription', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.emit('test', 42)
    bus.onAny(handler)
    expect(handler).not.toHaveBeenCalled()
  })

  it('offAny retire le handler — plus appelé après', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.onAny(handler)
    bus.offAny(handler)
    bus.emit('test', 42)
    expect(handler).not.toHaveBeenCalled()
  })

  it('onAny reçoit les events de tous les types', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.onAny(handler)
    bus.emit('scene:changed', 'game')
    bus.emit('input:action', { name: 'move-left' })
    expect(handler).toHaveBeenCalledTimes(2)
    expect(handler).toHaveBeenNthCalledWith(1, 'scene:changed', 'game')
    expect(handler).toHaveBeenNthCalledWith(2, 'input:action', { name: 'move-left' })
  })

  it('onAny reçoit undefined quand emit est appelé sans data', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.onAny(handler)
    bus.emit('noop')
    expect(handler).toHaveBeenCalledWith('noop', undefined)
  })

  it('plusieurs handlers onAny sont tous appelés', () => {
    const bus = new EventBus()
    const h1 = vi.fn()
    const h2 = vi.fn()
    bus.onAny(h1)
    bus.onAny(h2)
    bus.emit('test', 'hello')
    expect(h1).toHaveBeenCalledWith('test', 'hello')
    expect(h2).toHaveBeenCalledWith('test', 'hello')
  })

  it('once() appelle le handler exactement une fois', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.once('test', handler)
    bus.emit('test', 1)
    bus.emit('test', 2)
    bus.emit('test', 3)
    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(1)
  })

  it('once() se retire automatiquement après le premier appel', () => {
    const bus = new EventBus()
    const handler = vi.fn()
    bus.once('test', handler)
    bus.emit('test', 42)
    bus.emit('test', 43)
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('once() n\'interfère pas avec on() sur le même événement', () => {
    const bus = new EventBus()
    const onceHandler = vi.fn()
    const persistentHandler = vi.fn()
    bus.once('test', onceHandler)
    bus.on('test', persistentHandler)
    bus.emit('test', 1)
    bus.emit('test', 2)
    expect(onceHandler).toHaveBeenCalledOnce()
    expect(persistentHandler).toHaveBeenCalledTimes(2)
  })

  it('once() typé — handler reçoit le bon type', () => {
    type Events = { 'score:updated': number }
    const bus = new EventBus<Events>()
    const handler = vi.fn()
    bus.once('score:updated', handler)
    bus.emit('score:updated', 99)
    expect(handler).toHaveBeenCalledWith(99)
  })
})
