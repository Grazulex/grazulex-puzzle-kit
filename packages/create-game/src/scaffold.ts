import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'default')

function copyDir(src: string, dest: string, vars: Record<string, string>): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destEntry = entry.replace('.tpl', '')
    const destPath = join(dest, destEntry)
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, vars)
    } else {
      let content = readFileSync(srcPath, 'utf-8')
      for (const [key, value] of Object.entries(vars)) {
        content = content.replaceAll(`{{${key}}}`, value)
      }
      writeFileSync(destPath, content)
    }
  }
}

export function scaffold(targetDir: string, vars: Record<string, string>): void {
  copyDir(TEMPLATES_DIR, targetDir, vars)
}
