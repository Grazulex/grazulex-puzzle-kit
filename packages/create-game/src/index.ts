#!/usr/bin/env node
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import prompts from 'prompts'
import pc from 'picocolors'
import { scaffold } from './scaffold.js'

const result = await prompts([
  {
    type: 'text',
    name: 'name',
    message: 'Nom du jeu :',
    validate: (v: string) => v.trim().length > 0 || 'Le nom ne peut pas être vide',
  },
  {
    type: 'select',
    name: 'mode',
    message: 'Mode de boucle :',
    choices: [
      { title: 'Tour par tour', value: 'turnbased' },
      { title: 'Temps réel (60 UPS)', value: 'realtime' },
    ],
  },
  {
    type: 'confirm',
    name: 'save',
    message: 'Inclure le système de sauvegarde ?',
    initial: true,
  },
])

if (!result.name) process.exit(0)

const targetDir = resolve(process.cwd(), result.name as string)

if (existsSync(targetDir)) {
  console.error(pc.red(`Le dossier "${result.name}" existe déjà.`))
  process.exit(1)
}

mkdirSync(targetDir, { recursive: true })

scaffold(targetDir, {
  name: result.name as string,
  mode: result.mode as string,
})

console.log()
console.log(pc.green(`✓ Projet "${result.name}" créé !`))
console.log()
console.log('  Prochaines étapes :')
console.log(pc.cyan(`  cd ${result.name}`))
console.log(pc.cyan('  npm install'))
console.log(pc.cyan('  npm run dev'))
console.log()
