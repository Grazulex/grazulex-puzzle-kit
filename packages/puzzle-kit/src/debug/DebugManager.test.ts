import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventBus } from '../event-bus/EventBus'
import { DebugManager } from './DebugManager'

describe('DebugManager', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('enabled: true', () => {
    it('appelle console.log pour un event dont le channel est listé', () => {
      const bus = new EventBus()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({ bus, enabled: true, channels: ['scene'] })
      bus.emit('scene:changed', 'game')
      expect(spy).toHaveBeenCalledOnce()
      const msg = spy.mock.calls[0][0] as string
      expect(msg).toMatch(/\[debug\]\[scene\] scene:changed/)
      debug.destroy()
    })

    it('ne loggue pas un event dont le channel n\'est pas listé', () => {
      const bus = new EventBus()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({ bus, enabled: true, channels: ['scene'] })
      bus.emit('input:action', { name: 'move-left' })
      expect(spy).not.toHaveBeenCalled()
      debug.destroy()
    })

    it('utilise le logger custom si fourni pour ce channel', () => {
      const bus = new EventBus()
      const customLogger = vi.fn()
      const debug = new DebugManager({
        bus,
        enabled: true,
        channels: ['scene'],
        loggers: { scene: customLogger },
      })
      bus.emit('scene:changed', 'menu')
      expect(customLogger).toHaveBeenCalledWith('scene:changed', 'menu')
      debug.destroy()
    })

    it('le logger custom d\'un channel ne reçoit pas les events d\'un autre channel', () => {
      const bus = new EventBus()
      const customLogger = vi.fn()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({
        bus,
        enabled: true,
        channels: ['scene', 'input'],
        loggers: { scene: customLogger },
      })
      bus.emit('input:action', { name: 'move-left' })
      expect(customLogger).not.toHaveBeenCalled()
      expect(spy).toHaveBeenCalledOnce()
      debug.destroy()
    })

    it('ne loggue plus rien après destroy()', () => {
      const bus = new EventBus()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({ bus, enabled: true, channels: ['scene'] })
      debug.destroy()
      bus.emit('scene:changed', 'game')
      expect(spy).not.toHaveBeenCalled()
    })

    it('loggue un event sans ":" — channel = event entier', () => {
      const bus = new EventBus()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({ bus, enabled: true, channels: ['ping'] })
      bus.emit('ping', undefined)
      expect(spy).toHaveBeenCalledOnce()
      const msg = spy.mock.calls[0][0] as string
      expect(msg).toMatch(/\[debug\]\[ping\] ping/)
      debug.destroy()
    })

    it('premier event loggue +0ms (lazy init)', () => {
      const bus = new EventBus()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({ bus, enabled: true, channels: ['scene'] })
      bus.emit('scene:changed', 'game')
      const msg = spy.mock.calls[0][0] as string
      expect(msg).toMatch(/\+0ms$/)
      debug.destroy()
    })

    it('delta correct après passage par un logger custom', () => {
      vi.useFakeTimers()
      const bus = new EventBus()
      const customLogger = vi.fn()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({
        bus,
        enabled: true,
        channels: ['scene', 'input'],
        loggers: { input: customLogger },
      })
      bus.emit('input:action', { name: 'move-left' })
      vi.advanceTimersByTime(100)
      bus.emit('scene:changed', 'game')
      const msg = spy.mock.calls[0][0] as string
      expect(msg).toMatch(/\+100ms$/)
      debug.destroy()
      vi.useRealTimers()
    })
  })

  describe('enabled: false', () => {
    it('ne loggue jamais même si le channel est listé', () => {
      const bus = new EventBus()
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const debug = new DebugManager({ bus, enabled: false, channels: ['scene'] })
      bus.emit('scene:changed', 'game')
      expect(spy).not.toHaveBeenCalled()
      debug.destroy()
    })

    it('destroy() ne crashe pas', () => {
      const bus = new EventBus()
      const debug = new DebugManager({ bus, enabled: false, channels: [] })
      expect(() => debug.destroy()).not.toThrow()
    })
  })
})
