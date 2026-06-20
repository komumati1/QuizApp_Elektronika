// Prepares static assets for GitHub Pages:
// - Copies JSON files to public/pytania_extracted/
// - Copies images to public/{source_path} with normalized filenames
//   (dots/commas before extension → underscores, matching JSON paths)
// - Generates public/pytania_extracted/manifest.json

const fs = require('fs')
const path = require('path')

const projectDir = process.cwd()              // quiz/
const parentDir = path.join(projectDir, '..')  // elementy_elektroniczne/

function normalizeFilename(name) {
  const lastDot = name.lastIndexOf('.')
  if (lastDot === -1) return name.replace(/[.,]/g, '_')
  return name.substring(0, lastDot).replace(/[.,]/g, '_') + name.substring(lastDot)
}

// Find the actual file on disk matching a normalized JSON path
function resolveImage(relPathFromParent) {
  const absolute = path.join(parentDir, relPathFromParent)
  if (fs.existsSync(absolute)) return absolute

  const dir = path.dirname(absolute)
  const base = path.basename(absolute)
  const normalizedBase = normalizeFilename(base)

  if (!fs.existsSync(dir)) return null
  const match = fs.readdirSync(dir).find(f => normalizeFilename(f) === normalizedBase)
  return match ? path.join(dir, match) : null
}

function copyImage(sourcePath) {
  const actualFile = resolveImage(sourcePath)
  if (!actualFile) {
    console.warn(`  ⚠  Not found: ${sourcePath}`)
    return
  }
  // Destination keeps the path from JSON (already normalized) under public/
  const destPath = path.join(projectDir, 'public', sourcePath)
  if (fs.existsSync(destPath)) return  // already copied
  fs.mkdirSync(path.dirname(destPath), { recursive: true })
  fs.copyFileSync(actualFile, destPath)
  console.log(`  ✓  ${sourcePath}`)
}

const extractedDir = path.join(projectDir, 'pytania_extracted')
const publicExtractedDir = path.join(projectDir, 'public', 'pytania_extracted')
fs.mkdirSync(publicExtractedDir, { recursive: true })

const jsonFiles = fs.readdirSync(extractedDir)
  .filter(f => /^extracted.*\.json$/.test(f))
  .sort()

const manifest = []

for (const filename of jsonFiles) {
  console.log(`\nProcessing ${filename}...`)
  const filePath = path.join(extractedDir, filename)
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

  fs.copyFileSync(filePath, path.join(publicExtractedDir, filename))

  const imagePaths = new Set()
  for (const q of data.questions ?? []) {
    if (q.source_file) imagePaths.add(q.source_file)
    if (q.diagram?.image?.source) imagePaths.add(q.diagram.image.source)
  }
  for (const p of imagePaths) copyImage(p)

  manifest.push({ filename, metadata: data.metadata, questionCount: data.questions?.length ?? 0 })
}

fs.writeFileSync(
  path.join(publicExtractedDir, 'manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf-8'
)

console.log(`\n✓ Done — ${manifest.length} source files, manifest.json generated`)
