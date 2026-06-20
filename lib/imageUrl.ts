const READONLY = process.env.NEXT_PUBLIC_READONLY === 'true'
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

// In dev mode: proxy through Express (/source/* → localhost:3001) with fuzzy filename matching.
// In static/GH Pages mode: serve from public/ where prepare-static.js copied files
// with normalized names matching the JSON paths (dots/commas → underscores).
export function imageUrl(sourcePath: string): string {
  if (READONLY) {
    return `${BASE_PATH}/${sourcePath}`
  }
  return `/source/${sourcePath}`
}
