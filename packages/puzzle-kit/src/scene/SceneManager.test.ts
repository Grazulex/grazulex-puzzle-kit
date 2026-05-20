import { describe, it, expect, vi } from 'vitest'
import { EventBus } from '../event-bus/EventBus'
import type { Scene } from './Scene'
import { SceneManager } from './SceneManager'

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
