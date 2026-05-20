import { EventBus, AudioManager, SaveSystem, SceneManager, GameLoop } from '@grazulex/puzzle-kit'
import { audioConfig } from './config/audio'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'
import type { GameState } from './types'

const bus = new EventBus()
const audio = new AudioManager({ bus, config: audioConfig })
const save = new SaveSystem<GameState>({ version: 1, bus })
const scenes = new SceneManager({ bus, scenes: {} })
const loop = new GameLoop({ mode: 'turnbased' })

scenes.register('menu', class extends MenuScene { constructor() { super(bus) } })
scenes.register('game', GameScene)

bus.on('scene:goto', (name: string) => scenes.goto(name))

loop.onTurn = (action) => {
  console.log('action reçue', action)
}

scenes.goto('menu')
loop.start()

if (import.meta.env.DEV) {
  Object.assign(window, { bus, audio, save, scenes, loop })
}
