import { describe, it, expect } from 'vitest'
import { processTemplate } from './scaffold'

describe('processTemplate', () => {
  it('substitue une variable simple', () => {
    expect(processTemplate('Hello {{name}}!', { name: 'world' })).toBe('Hello world!')
  })

  it('substitue plusieurs variables', () => {
    const result = processTemplate('mode: {{mode}}, name: {{name}}', {
      mode: 'turnbased',
      name: 'my-game',
    })
    expect(result).toBe('mode: turnbased, name: my-game')
  })

  it('inclut le bloc si la variable vaut "true"', () => {
    const tpl = '{{#if save}}\nimport { SaveSystem } from "kit"\n{{/if}}\nconst bus = new EventBus()'
    const result = processTemplate(tpl, { save: 'true' })
    expect(result).toContain('import { SaveSystem }')
    expect(result).toContain('const bus = new EventBus()')
  })

  it('exclut le bloc si la variable vaut "false"', () => {
    const tpl = '{{#if save}}\nimport { SaveSystem } from "kit"\n{{/if}}\nconst bus = new EventBus()'
    const result = processTemplate(tpl, { save: 'false' })
    expect(result).not.toContain('import { SaveSystem }')
    expect(result).toContain('const bus = new EventBus()')
  })

  it('supporte les blocs inline (sur une seule ligne)', () => {
    const tpl = 'Object.assign(window, { bus, {{#if save}}save, {{/if}}scenes })'
    expect(processTemplate(tpl, { save: 'true' })).toBe(
      'Object.assign(window, { bus, save, scenes })'
    )
    expect(processTemplate(tpl, { save: 'false' })).toBe(
      'Object.assign(window, { bus, scenes })'
    )
  })

  it('gère blocs conditionnels et variables ensemble', () => {
    const tpl =
      '{{#if save}}const save = new Save()\n{{/if}}new GameLoop({ mode: "{{mode}}" })'
    expect(processTemplate(tpl, { save: 'false', mode: 'turnbased' })).toBe(
      'new GameLoop({ mode: "turnbased" })'
    )
  })

  it('laisse {{var}} vide si la clé est absente', () => {
    expect(processTemplate('Hello {{unknown}}!', {})).toBe('Hello !')
  })
})
