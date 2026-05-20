import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'event-bus/index': 'src/event-bus/EventBus.ts',
    'audio/index': 'src/audio/AudioManager.ts',
    'save/index': 'src/save/SaveSystem.ts',
    'scene/index': 'src/scene/SceneManager.ts',
    'loop/index': 'src/loop/GameLoop.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
})
