import { EventBus, AudioManager, {{#if save}}SaveSystem, {{/if}}SceneManager, GameLoop } from '@grazulex/puzzle-kit'
import { audioConfig } from './config/audio'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
{{#if save}}
import type { GameState } from './types'
{{/if}}

type GameEvents = {
  'scene:goto': string
  'scene:back': undefined
}

const bus = new EventBus<GameEvents>()
const audio = new AudioManager({ bus, config: audioConfig })
{{#if save}}
const save = new SaveSystem<GameState>({ version: 1, bus })
{{/if}}
const scenes = new SceneManager({ bus, scenes: {} })
const loop = new GameLoop({ mode: '{{mode}}' })

scenes.register('menu', class extends MenuScene { constructor() { super(bus) } })
scenes.register('game', GameScene)

bus.on('scene:goto', (name: string) => scenes.goto(name))

loop.onTurn = (action) => {
  console.log('action reçue', action)
}

scenes.goto('menu')
loop.start()

if (import.meta.env.DEV) {
  Object.assign(window, { bus, audio, {{#if save}}save, {{/if}}scenes, loop })
}
