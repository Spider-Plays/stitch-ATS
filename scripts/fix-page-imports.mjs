import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SRC = path.join(__dirname, '..', 'src')
const PAGES = path.join(SRC, 'pages')

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts')) files.push(full)
  }
  return files
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const cssImports = content.match(/^import '\.\/[^']+\.css'$/gm) ?? []
  if (cssImports.length) {
    content = content.replace(/^import '\.\/[^']+\.css'\n/gm, '')
    const lastImportIdx = [...content.matchAll(/^import .+$/gm)].pop()?.index
    if (lastImportIdx !== undefined) {
      const lineEnd = content.indexOf('\n', lastImportIdx)
      const insert = '\n' + cssImports.join('\n')
      content = content.slice(0, lineEnd) + insert + content.slice(lineEnd)
    }
  }

  const replacements = [
    [/from ['"](\.\.\/)+components\//g, "from '@/components/"],
    [/from ['"](\.\.\/)+services\//g, "from '@/services/"],
    [/from ['"](\.\.\/)+hooks\//g, "from '@/hooks/"],
    [/from ['"](\.\.\/)+store\//g, "from '@/store/"],
    [/from ['"](\.\.\/)+contexts\//g, "from '@/contexts/"],
    [/from ['"](\.\.\/)+types['"]/g, "from '@/types'"],
    [/from ['"](\.\.\/)+lib\//g, "from '@/lib/"],
    [/from ['"](\.\.\/)+config\//g, "from '@/config/"],
  ]
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }

  fs.writeFileSync(filePath, content)
}

for (const file of walk(PAGES)) fixFile(file)
console.log('Fixed page imports')
