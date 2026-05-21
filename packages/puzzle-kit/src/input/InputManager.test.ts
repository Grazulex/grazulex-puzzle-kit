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

  it('emits input:action for alternate bound key', () => {
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

  it('calls preventDefault for arrow keys', () => {
    const bus = new EventBus<InputEvents>()
    input = new InputManager({ bus })
    input.bind('move-left', ['ArrowLeft'])

    const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true, cancelable: true })
    document.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })
})

describe('InputManager — mouse', () => {
  let input: InputManager

  afterEach(() => input?.destroy())

  it('emits input:click on mousedown + mouseup without movement', () => {
    const bus = new EventBus<InputEvents>()
    const clicks: Array<{ x: number; y: number }> = []
    bus.on('input:click', (data) => clicks.push(data))
    input = new InputManager({ bus })

    document.dispatchEvent(new MouseEvent('mousedown', { clientX: 10, clientY: 20, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 10, clientY: 20, bubbles: true }))

    expect(clicks).toEqual([{ x: 10, y: 20 }])
  })

  it('emits input:drag-start then input:drag-end when mouse moves > 10px', () => {
    const bus = new EventBus<InputEvents>()
    const dragStarts: Array<{ x: number; y: number }> = []
    const dragEnds: Array<{ x: number; y: number }> = []
    bus.on('input:drag-start', (data) => dragStarts.push(data))
    bus.on('input:drag-end', (data) => dragEnds.push(data))
    input = new InputManager({ bus })

    document.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 15, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 15, clientY: 0, bubbles: true }))

    expect(dragStarts).toEqual([{ x: 0, y: 0 }])
    expect(dragEnds).toEqual([{ x: 15, y: 0 }])
  })

  it('does not emit drag-start for movement <= 10px', () => {
    const bus = new EventBus<InputEvents>()
    const handler = vi.fn()
    bus.on('input:drag-start', handler)
    input = new InputManager({ bus })

    document.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: 5, clientY: 0, bubbles: true }))

    expect(handler).not.toHaveBeenCalled()
  })
})
