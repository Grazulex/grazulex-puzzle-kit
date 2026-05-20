# @grazulex/puzzle-kit

Framework TypeScript opinionated pour jeux de puzzle et de réflexion browser. Publiez sur [itch.io](https://itch.io) sans reconstruire la même stack à chaque jeu.

## Démarrage rapide

```bash
npm create grazulex-game mon-jeu
cd mon-jeu
npm install
npm run dev
```

Le projet généré contient une scène menu → jeu fonctionnelle, l'audio, la sauvegarde et la boucle de jeu déjà câblés.

---

## Installation manuelle

```bash
npm install @grazulex/puzzle-kit howler
```

> `howler` est une peer dependency — tu l'installes dans ton jeu, pas dans le framework.

---

## Modules

### EventBus

Pub/sub typé. Sert de lien entre tous les modules sans couplage direct.

```ts
import { EventBus } from '@grazulex/puzzle-kit'

// Sans type — fonctionne comme avant
const bus = new EventBus()
bus.on('score:updated', (score: number) => console.log(score))
bus.emit('score:updated', 42)
bus.off('score:updated', handler)
```

Avec un map d'événements, les typos sont détectées à la compilation :

```ts
type GameEvents = {
  'score:updated': number
  'scene:goto': string
  'game:over': undefined
}

const bus = new EventBus<GameEvents>()
bus.emit('score:updated', 42)    // ✅
bus.emit('scroe:updated', 42)    // ❌ TypeScript error — typo détectée
bus.emit('scene:goto', 'game')   // ✅
```

---

### SceneManager

Gestion des écrans avec historique de navigation.

```ts
import { SceneManager } from '@grazulex/puzzle-kit'
import type { Scene } from '@grazulex/puzzle-kit'

class MenuScene implements Scene {
  onEnter(params?: Record<string, unknown>) { /* afficher le menu */ }
  onExit() { /* nettoyer */ }
  update(dt: number) {}
  render() {}
}

class GameScene implements Scene {
  onEnter(params?: Record<string, unknown>) { /* démarrer le jeu */ }
  onExit() {}
  update(dt: number) {}
  render() {}
}

const scenes = new SceneManager({ bus, scenes: {} })

// Enregistrer les scènes
scenes.register('menu', MenuScene)
scenes.register('game', GameScene)

// Naviguer
scenes.goto('game', { level: 2 })   // passe des paramètres à onEnter
scenes.back()                        // revenir à la scène précédente
scenes.current()                     // instance de la scène active
```

Les scènes communiquent entre elles via l'EventBus pour éviter les dépendances circulaires :

```ts
// Dans une scène
bus.emit('scene:goto', 'game')

// Dans main.ts
bus.on('scene:goto', (name: string) => scenes.goto(name))
```

---

### SaveSystem

Sauvegarde versionnée en localStorage avec migration automatique.

```ts
import { SaveSystem } from '@grazulex/puzzle-kit'

interface GameState {
  score: number
  level: number
}

const save = new SaveSystem<GameState>({ version: 1, bus })

// Sauvegarder
save.snapshot({ score: 100, level: 3 })

// Restaurer (null si rien ou version incompatible)
const state = save.restore()

// Supprimer
save.clear()

// Migration de version
save.onVersionMismatch = (oldVersion, currentVersion, data) => {
  // transformer l'ancien format vers le nouveau
  return { score: (data as any).points ?? 0, level: 1 }
}
```

Émet `'save:restored'` et `'save:cleared'` sur le bus.

---

### AudioManager

Wrapper Howler.js avec layers SFX/musique indépendants et persistance des volumes.

```ts
import { AudioManager } from '@grazulex/puzzle-kit'
import type { AudioConfig } from '@grazulex/puzzle-kit'

const audioConfig: AudioConfig = {
  sounds: {
    'main-theme': { src: '/audio/main-theme.mp3', type: 'music' },
    'click':      { src: '/audio/click.mp3',      type: 'sfx'   },
    'win':        { src: '/audio/win.mp3',         type: 'sfx'   },
  },
}

const audio = new AudioManager({ bus, config: audioConfig })

// Musique (loop par défaut)
audio.playMusic('main-theme', { loop: true })
audio.fadeOut('main-theme', 1000)

// Effets sonores
audio.playSFX('click')

// Volumes indépendants (persistent en localStorage)
audio.setMasterVolume(0.7)   // multiplie tout (défaut: 1.0)
audio.getMasterVolume()      // → 0.7

audio.setMusicVolume(0.8)    // pour les sons type 'music' (défaut: 0.8)
audio.getMusicVolume()       // → 0.8

audio.setSFXVolume(0.5)      // pour les sons type 'sfx' (défaut: 1.0)
audio.getSFXVolume()         // → 0.5

// Volume effectif = master × typeVolume × (muted ? 0 : 1)
audio.toggleMute()
audio.isMuted()              // → true
```

---

### GameLoop

Deux modes au choix.

#### Mode tour par tour (puzzles, deckbuilders, roguelikes)

```ts
import { GameLoop } from '@grazulex/puzzle-kit'

const loop = new GameLoop({ mode: 'turnbased' })

loop.onTurn = (action) => {
  console.log('action reçue', action)
  // résoudre l'action, mettre à jour l'état
}

loop.start()

// Depuis l'UI ou une scène
loop.submitAction({ type: 'move', from: 'A1', to: 'B3' })
loop.submitAction({ type: 'play-card', cardId: 'shield' })

loop.stop()
```

#### Mode temps réel (60 UPS fixe)

```ts
const loop = new GameLoop({ mode: 'realtime', ups: 60 })

loop.onUpdate = (dt) => {
  // logique de jeu — dt en secondes
}

loop.onRender = (alpha) => {
  // rendu avec interpolation
}

loop.start()
loop.pause()
loop.resume()
loop.stop()
```

---

## Exemple complet — main.ts

```ts
import { EventBus, AudioManager, SaveSystem, SceneManager, GameLoop } from '@grazulex/puzzle-kit'
import type { AudioConfig } from '@grazulex/puzzle-kit'
import { MenuScene } from './scenes/MenuScene'
import { GameScene } from './scenes/GameScene'

interface GameState {
  score: number
  level: number
}

const audioConfig: AudioConfig = {
  sounds: {
    'theme': { src: '/audio/theme.mp3', type: 'music' },
    'click': { src: '/audio/click.mp3', type: 'sfx' },
  },
}

const bus    = new EventBus()
const audio  = new AudioManager({ bus, config: audioConfig })
const save   = new SaveSystem<GameState>({ version: 1, bus })
const scenes = new SceneManager({ bus, scenes: {} })
const loop   = new GameLoop({ mode: 'turnbased' })

scenes.register('menu', MenuScene)
scenes.register('game', GameScene)

// Navigation via EventBus (évite les dépendances circulaires)
bus.on('scene:goto', (name: string) => scenes.goto(name))

loop.onTurn = (action) => {
  // traiter les actions du joueur
}

scenes.goto('menu')
loop.start()
```

---

## Imports par module (tree-shaking)

```ts
import { EventBus }    from '@grazulex/puzzle-kit/event-bus'
import { AudioManager } from '@grazulex/puzzle-kit/audio'
import { SaveSystem }   from '@grazulex/puzzle-kit/save'
import { SceneManager } from '@grazulex/puzzle-kit/scene'
import { GameLoop }     from '@grazulex/puzzle-kit/loop'
```

---

## Publier une nouvelle version

```bash
# 1. Bumper les versions dans les deux package.json
#    packages/puzzle-kit/package.json
#    packages/create-game/package.json

# 2. Commit + tag
git add packages/puzzle-kit/package.json packages/create-game/package.json
git commit -m "chore: bump to v0.2.0"
git tag -a v0.2.0 -m "v0.2.0"
git push && git push origin v0.2.0

# GitHub Actions publie automatiquement sur npm
```

---

## Licence

MIT
