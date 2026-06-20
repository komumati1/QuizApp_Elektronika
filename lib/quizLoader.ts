import { QuizData, SourceInfo, Question } from './types'

const READONLY = process.env.NEXT_PUBLIC_READONLY === 'true'
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''

function mergeFiles(filenames: string[], datas: QuizData[]): QuizData {
  let metadata = null
  const questions: Question[] = []
  for (let i = 0; i < datas.length; i++) {
    if (!metadata) metadata = datas[i].metadata
    const base = filenames[i].replace('.json', '')
    for (const q of datas[i].questions ?? []) {
      questions.push({ ...q, _uid: `${base}:${q.id}`, _sourceFile: filenames[i] })
    }
  }
  return { metadata: metadata!, questions }
}

export async function loadSources(): Promise<SourceInfo[]> {
  if (READONLY) {
    const r = await fetch(`${BASE_PATH}/pytania_extracted/manifest.json`)
    if (!r.ok) throw new Error('Cannot load manifest.json')
    return r.json()
  }
  const r = await fetch('/api/sources')
  if (!r.ok) throw new Error('Cannot load sources')
  return r.json()
}

export async function loadQuestions(files: string[]): Promise<QuizData> {
  if (READONLY) {
    const datas = await Promise.all(
      files.map(f =>
        fetch(`${BASE_PATH}/pytania_extracted/${f}`)
          .then(r => { if (!r.ok) throw new Error(`Cannot load ${f}`); return r.json() })
      )
    )
    return mergeFiles(files, datas)
  }
  const params = files.length ? `?files=${files.join(',')}` : ''
  const r = await fetch(`/api/questions${params}`)
  if (!r.ok) throw new Error('Cannot load questions')
  return r.json()
}

export async function saveQuestion(updated: Question): Promise<void> {
  if (READONLY) throw new Error('Read-only mode')
  const r = await fetch(`/api/question/${updated._sourceFile}/${updated.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  })
  if (!r.ok) throw new Error('Save failed')
}
