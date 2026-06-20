// Prepares static assets for GitHub Pages:
// - Copies JSON files to public/pytania_extracted/
// - Copies images to public/{source_path} with normalized filenames
//   (dots/commas before extension → underscores, matching JSON paths)
// - Generates public/pytania_extracted/manifest.json
//
// JSON paths look like "quiz/pytania/zestaw_1/Screenshot_2024-06-29_at_16_09_43.png"
// (prefix "quiz/" because they were extracted from a subdirectory context).
//
// Resolution order for each image:
//   1. parentDir/sourcePath        — works locally (elementy_elektroniczne/ as parent)
//   2. parentDir/sourcePath fuzzy  — same + filename normalization
//   3. projectDir/stripped         — works in CI (repo root = project root, strip "quiz/" prefix)
//   4. projectDir/stripped fuzzy   — same + filename normalization

const fs = require('fs')
const path = require('path')

const projectDir = process.cwd()
const parentDir = path.join(projectDir, '..')

function normalizeFilename(name) {
  const lastDot = name.lastIndexOf('.')
  if (lastDot === -1) return name.replace(/[.,]/g, '_')
  return name.substring(0, lastDot).replace(/[.,]/g, '_') + name.substring(lastDot)
}

function findInDir(dir, normalizedBase) {
  if (!fs.existsSync(dir)) return null
  const match = fs.readdirSync(dir).find(f => normalizeFilename(f) === normalizedBase)
  return match ? path.join(dir, match) : null
}

function resolveImage(sourcePath) {
  const base = path.basename(sourcePath)
  const normalizedBase = normalizeFilename(base)

  // 1 & 2: relative to parent directory (local dev layout)
  const absParent = path.join(parentDir, sourcePath)
  if (fs.existsSync(absParent)) return absParent
  const foundParent = findInDir(path.dirname(absParent), normalizedBase)
  if (foundParent) return foundParent

  // 3 & 4: strip first path segment ("quiz/") and look in project dir (CI layout)
  const stripped = sourcePath.split('/').slice(1).join('/')
  if (stripped) {
    const absProject = path.join(projectDir, stripped)
    if (fs.existsSync(absProject)) return absProject
    const foundProject = findInDir(path.dirname(absProject), normalizedBase)
    if (foundProject) return foundProject
  }

  return null
}

function copyImage(sourcePath) {
  const actualFile = resolveImage(sourcePath)
  if (!actualFile) {
    console.warn(`  ⚠  Not found: ${sourcePath}`)
    return
  }
  const destPath = path.join(projectDir, 'public', sourcePath)
  if (fs.existsSync(destPath)) return
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
