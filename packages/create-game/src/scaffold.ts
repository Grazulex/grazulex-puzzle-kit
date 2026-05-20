import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const TEMPLATES_DIR = join(__dirname, '..', 'templates', 'default')

export function processTemplate(content: string, vars: Record<string, string>): string {
  content = content.replace(
    /\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
    (_, key: string, block: string) => (vars[key] === 'true' ? block : '')
  )
  return content.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '')
}

function copyDir(src: string, dest: string, vars: Record<string, string>): void {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destEntry = entry.replace('.tpl', '')
    const destPath = join(dest, destEntry)
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath, vars)
    } else {
      const content = readFileSync(srcPath, 'utf-8')
      writeFileSync(destPath, processTemplate(content, vars))
    }
  }
}

export function scaffold(targetDir: string, vars: Record<string, string>): void {
  copyDir(TEMPLATES_DIR, targetDir, vars)
}
