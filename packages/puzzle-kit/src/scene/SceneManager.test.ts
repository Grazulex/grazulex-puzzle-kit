import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../event-bus/EventBus'
import type { Scene } from './Scene'
import { SceneManager } from './SceneManager'
import type { TransitionOptions } from './SceneManager'

const makeScene = (): Scene => ({
  onEnter: vi.fn(),
  onExit: vi.fn(),
  update: vi.fn(),
  render: vi.fn(),
})

describe('SceneManager', () => {
  it('current() est null avant tout goto()', () => {
    const mgr = new SceneManager({ bus: new EventBus(), scenes: {} })
    expect(mgr.current()).toBeNull()
  })

  it('goto() instancie et appelle onEnter avec params', () => {
    const bus = new EventBus()
    const scene = makeScene()
    const mgr = new SceneManager({ bus, scenes: { game: class { onEnter = scene.onEnter; onExit = scene.onExit; update = scene.update; render = scene.render } } })
    mgr.goto('game', { level: 2 })
    expect(scene.onEnter).toHaveBeenCalledWith({ level: 2 })
  })

  it('goto() appelle onExit sur la scène précédente', () => {
    const bus = new EventBus()
    const sceneA = makeScene()
    const sceneB = makeScene()
    const SceneA = class { onEnter = sceneA.onEnter; onExit = sceneA.onExit; update = sceneA.update; render = sceneA.render }
    const SceneB = class { onEnter = sceneB.onEnter; onExit = sceneB.onExit; update = sceneB.update; render = sceneB.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA, b: SceneB } })
    mgr.goto('a')
    mgr.goto('b')
    expect(sceneA.onExit).toHaveBeenCalled()
  })

  it('back() revient à la scène précédente', () => {
    const bus = new EventBus()
    const sceneA = makeScene()
    const sceneB = makeScene()
    const SceneA = class { onEnter = sceneA.onEnter; onExit = sceneA.onExit; update = sceneA.update; render = sceneA.render }
    const SceneB = class { onEnter = sceneB.onEnter; onExit = sceneB.onExit; update = sceneB.update; render = sceneB.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA, b: SceneB } })
    mgr.goto('a')
    mgr.goto('b')
    mgr.back()
    expect(sceneA.onEnter).toHaveBeenCalledTimes(2)
  })

  it('register() permet d\'enregistrer une scène après construction', () => {
    const bus = new EventBus()
    const scene = makeScene()
    const SceneA = class { onEnter = scene.onEnter; onExit = scene.onExit; update = scene.update; render = scene.render }
    const mgr = new SceneManager({ bus, scenes: {} })
    mgr.register('a', SceneA)
    mgr.goto('a')
    expect(scene.onEnter).toHaveBeenCalled()
  })

  it('émet "scene:changed" sur goto()', () => {
    const bus = new EventBus()
    const scene = makeScene()
    const SceneA = class { onEnter = scene.onEnter; onExit = scene.onExit; update = scene.update; render = scene.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA } })
    const handler = vi.fn()
    bus.on('scene:changed', handler)
    mgr.goto('a')
    expect(handler).toHaveBeenCalledWith('a')
  })

  it('lance une erreur si la scène n\'existe pas', () => {
    const mgr = new SceneManager({ bus: new EventBus(), scenes: {} })
    expect(() => mgr.goto('unknown')).toThrow('Scene "unknown" not registered')
  })
})

describe('SceneManager — transitions synchrones', () => {
  it('goto() sans container reste synchrone', () => {
    const bus = new EventBus()
    const scene = makeScene()
    const SceneA = class { onEnter = scene.onEnter; onExit = scene.onExit; update = scene.update; render = scene.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA } })
    const changed = vi.fn()
    bus.on('scene:changed', changed)

    mgr.goto('a')

    expect(scene.onEnter).toHaveBeenCalled()
    expect(changed).toHaveBeenCalledWith('a')
  })

  it('goto() avec transition: none est synchrone même avec container', () => {
    const bus = new EventBus()
    const scene = makeScene()
    const SceneA = class { onEnter = scene.onEnter; onExit = scene.onExit; update = scene.update; render = scene.render }
    const container = document.createElement('div')
    const mgr = new SceneManager({ bus, scenes: { a: SceneA }, container })
    const changed = vi.fn()
    bus.on('scene:changed', changed)

    mgr.goto('a', {}, { transition: 'none' })

    expect(scene.onEnter).toHaveBeenCalled()
    expect(changed).toHaveBeenCalledWith('a')
  })

  it('goto() sans 3e argument reste synchrone avec container', () => {
    const bus = new EventBus()
    const scene = makeScene()
    const SceneA = class { onEnter = scene.onEnter; onExit = scene.onExit; update = scene.update; render = scene.render }
    const container = document.createElement('div')
    const mgr = new SceneManager({ bus, scenes: { a: SceneA }, container })
    const changed = vi.fn()
    bus.on('scene:changed', changed)

    mgr.goto('a')

    expect(scene.onEnter).toHaveBeenCalled()
    expect(changed).toHaveBeenCalledWith('a')
  })

  it('container reçoit un overlay div à la construction', () => {
    const bus = new EventBus()
    const container = document.createElement('div')

    new SceneManager({ bus, scenes: {}, container })

    const overlay = container.firstElementChild as HTMLElement
    expect(overlay).not.toBeNull()
    expect(overlay.style.position).toBe('absolute')
    expect(overlay.style.opacity).toBe('0')
    expect(overlay.style.zIndex).toBe('9999')
  })
})

describe('SceneManager — fade goto()', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.removeChild(container)
  })

  it('onExit et onEnter appelés après 200ms (fade 400ms)', () => {
    const bus = new EventBus()
    const sceneA = makeScene()
    const sceneB = makeScene()
    const SceneA = class { onEnter = sceneA.onEnter; onExit = sceneA.onExit; update = sceneA.update; render = sceneA.render }
    const SceneB = class { onEnter = sceneB.onEnter; onExit = sceneB.onExit; update = sceneB.update; render = sceneB.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA, b: SceneB }, container })
    mgr.goto('a')

    mgr.goto('b', {}, { transition: 'fade', duration: 400 })

    expect(sceneB.onEnter).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(sceneA.onExit).toHaveBeenCalled()
    expect(sceneB.onEnter).toHaveBeenCalled()
  })

  it('scene:changed émis après 400ms, pas avant', () => {
    const bus = new EventBus()
    const sceneA = makeScene()
    const sceneB = makeScene()
    const SceneA = class { onEnter = sceneA.onEnter; onExit = sceneA.onExit; update = sceneA.update; render = sceneA.render }
    const SceneB = class { onEnter = sceneB.onEnter; onExit = sceneB.onExit; update = sceneB.update; render = sceneB.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA, b: SceneB }, container })
    mgr.goto('a')
    const changed = vi.fn()
    bus.on('scene:changed', changed)

    mgr.goto('b', {}, { transition: 'fade', duration: 400 })

    vi.advanceTimersByTime(200)
    expect(changed).not.toHaveBeenCalled()
    vi.advanceTimersByTime(200)
    expect(changed).toHaveBeenCalledWith('b')
  })

  it('overlay opacity passe par 1 puis revient à 0', () => {
    const bus = new EventBus()
    const scene = makeScene()
    const SceneA = class { onEnter = scene.onEnter; onExit = scene.onExit; update = scene.update; render = scene.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA }, container })
    const overlay = container.firstElementChild as HTMLElement

    mgr.goto('a', {}, { transition: 'fade', duration: 400 })

    expect(overlay.style.opacity).toBe('1')
    vi.advanceTimersByTime(200)
    expect(overlay.style.opacity).toBe('0')
    vi.advanceTimersByTime(200)
    expect(overlay.style.pointerEvents).toBe('none')
  })
})

describe('SceneManager — fade back() et annulation', () => {
  let container: HTMLDivElement

  beforeEach(() => {
    vi.useFakeTimers()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  afterEach(() => {
    vi.useRealTimers()
    document.body.removeChild(container)
  })

  it('back() avec fade appelle onEnter de la scène précédente après 200ms', () => {
    const bus = new EventBus()
    const sceneA = makeScene()
    const sceneB = makeScene()
    const SceneA = class { onEnter = sceneA.onEnter; onExit = sceneA.onExit; update = sceneA.update; render = sceneA.render }
    const SceneB = class { onEnter = sceneB.onEnter; onExit = sceneB.onExit; update = sceneB.update; render = sceneB.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA, b: SceneB }, container })
    mgr.goto('a')
    mgr.goto('b')

    mgr.back({ transition: 'fade', duration: 400 })

    expect(sceneA.onEnter).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(200)
    expect(sceneA.onEnter).toHaveBeenCalledTimes(2)
  })

  it('back() avec fade émet scene:changed après 400ms', () => {
    const bus = new EventBus()
    const sceneA = makeScene()
    const sceneB = makeScene()
    const SceneA = class { onEnter = sceneA.onEnter; onExit = sceneA.onExit; update = sceneA.update; render = sceneA.render }
    const SceneB = class { onEnter = sceneB.onEnter; onExit = sceneB.onExit; update = sceneB.update; render = sceneB.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA, b: SceneB }, container })
    mgr.goto('a')
    mgr.goto('b')
    const changed = vi.fn()
    bus.on('scene:changed', changed)

    mgr.back({ transition: 'fade', duration: 400 })
    vi.advanceTimersByTime(400)

    expect(changed).toHaveBeenCalledWith('a')
  })

  it('double goto rapide: seule la 2e transition se complète', () => {
    const bus = new EventBus()
    const sceneA = makeScene()
    const sceneB = makeScene()
    const sceneC = makeScene()
    const SceneA = class { onEnter = sceneA.onEnter; onExit = sceneA.onExit; update = sceneA.update; render = sceneA.render }
    const SceneB = class { onEnter = sceneB.onEnter; onExit = sceneB.onExit; update = sceneB.update; render = sceneB.render }
    const SceneC = class { onEnter = sceneC.onEnter; onExit = sceneC.onExit; update = sceneC.update; render = sceneC.render }
    const mgr = new SceneManager({ bus, scenes: { a: SceneA, b: SceneB, c: SceneC }, container })
    mgr.goto('a')
    const changed = vi.fn()
    bus.on('scene:changed', changed)

    mgr.goto('b', {}, { transition: 'fade', duration: 400 })
    mgr.goto('c', {}, { transition: 'fade', duration: 400 })

    vi.advanceTimersByTime(200)
    expect(sceneB.onEnter).not.toHaveBeenCalled()
    expect(sceneC.onEnter).toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(changed).toHaveBeenLastCalledWith('c')
    expect(changed).not.toHaveBeenCalledWith('b')
  })
})
