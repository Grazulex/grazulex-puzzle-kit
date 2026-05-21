import { describe, it, expect, vi, afterEach } from 'vitest'
import { EventBus } from '../event-bus/EventBus'
import { InputManager } from './InputManager'

type InputEvents = {
  'input:action': { name: string }
  'input:click': { x: number; y: number }
  'input:drag-start': { x: number; y: number }
  'input:drag-end': { x: number; y: number }
}

describe('InputManager — keyboard', () => {
  let input: InputManager

  afterEach(() => input?.destroy())

  it('emits input:action when bound key is pressed', () => {
    const bus = new EventBus<InputEvents>()
    const received: string[] = []
    bus.on('input:action', (data) => received.push(data.name))
    input = new InputManager({ bus })
    input.bind('move-left', ['ArrowLeft', 'a'])

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }))

    expect(received).toEqual(['move-left'])
  })

  it('emits input:action for each bound key', () => {
    const bus = new EventBus<InputEvents>()
    const received: string[] = []
    bus.on('input:action', (data) => received.push(data.name))
    input = new InputManager({ bus })
    input.bind('move-left', ['ArrowLeft', 'a'])

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }))

    expect(received).toEqual(['move-left'])
  })

  it('emits nothing for unbound key', () => {
    const bus = new EventBus<InputEvents>()
    const handler = vi.fn()
    bus.on('input:action', handler)
    input = new InputManager({ bus })

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(handler).not.toHaveBeenCalled()
  })

  it('stops emitting after destroy()', () => {
    const bus = new EventBus<InputEvents>()
    const handler = vi.fn()
    bus.on('input:action', handler)
    input = new InputManager({ bus })
    input.bind('confirm', ['Enter'])
    input.destroy()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

    expect(handler).not.toHaveBeenCalled()
  })
})
