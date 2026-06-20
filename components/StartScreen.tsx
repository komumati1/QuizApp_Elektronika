'use client'

import { SourceInfo } from '@/lib/types'

interface Props {
  sources: SourceInfo[]
  selectedFiles: string[]
  onSelectFiles: (files: string[]) => void
  shuffleChoices: boolean
  onShuffleChoices: (v: boolean) => void
  error: string | null
  onStart: (randomize: boolean) => void
}

function getLabel(s: SourceInfo): string {
  const dir = s.metadata?.source_dir ?? ''
  const match = dir.match(/zestaw_\w+/)
  return match ? match[0] : s.filename.replace('.json', '')
}

export default function StartScreen({ sources, selectedFiles, onSelectFiles, shuffleChoices, onShuffleChoices, error, onStart }: Props) {
  const allSelected = sources.length > 0 && selectedFiles.length === sources.length
  const totalSelected = sources
    .filter(s => selectedFiles.includes(s.filename))
    .reduce((sum, s) => sum + s.questionCount, 0)

  const toggle = (filename: string) =>
    onSelectFiles(
      selectedFiles.includes(filename)
        ? selectedFiles.filter(f => f !== filename)
        : [...selectedFiles, filename]
    )

  return (
    <div>
      <h1>Quiz — Elementy Elektroniczne</h1>

      {error && (
        <div className="card" style={{ borderColor: '#b52020', background: '#fff5f5', marginTop: 12 }}>
          <p className="wrong">Błąd: {error}</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            Uruchom serwer: <code>npm run dev</code>
          </p>
        </div>
      )}

      {sources.length > 0 && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="label">Źródła pytań</span>
            <button
              style={{ fontSize: 12, padding: '3px 10px' }}
              onClick={() => onSelectFiles(allSelected ? [] : sources.map(s => s.filename))}
            >
              {allSelected ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
            </button>
          </div>

          {sources.map(s => {
            const selected = selectedFiles.includes(s.filename)
            const note = s.metadata?.file_note ?? s.metadata?.notes?.[0]
            return (
              <label
                key={s.filename}
                style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                  padding: '8px 6px', borderRadius: 3, marginBottom: 4, cursor: 'pointer',
                  background: selected ? '#f0f4ff' : undefined,
                  border: '1px solid ' + (selected ? '#b0c4de' : '#e0e0e0'),
                }}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => toggle(s.filename)}
                  style={{ marginTop: 3, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <strong style={{ textTransform: 'capitalize' }}>{getLabel(s)}</strong>
                    <span style={{ fontSize: 12, color: '#777' }}>
                      {s.filename} — {s.questionCount} pytań
                    </span>
                  </div>
                  {s.metadata?.source_dir && (
                    <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{s.metadata.source_dir}</div>
                  )}
                  {note && (
                    <div style={{ fontSize: 11, color: '#a05000', marginTop: 3, lineHeight: 1.4 }}>{note}</div>
                  )}
                </div>
              </label>
            )
          })}

          {selectedFiles.length === 0 && (
            <p style={{ fontSize: 13, color: '#b52020', marginTop: 6 }}>Zaznacz co najmniej jeden plik.</p>
          )}
          <div style={{ marginTop: 10, fontSize: 13, color: '#555' }}>
            Wybrano: <strong>{selectedFiles.length}</strong> plików,{' '}
            <strong>{totalSelected}</strong> pytań łącznie
          </div>
        </div>
      )}

      <div className="card" style={{ marginTop: 12 }}>
        <span className="label" style={{ marginBottom: 8, display: 'block' }}>Opcje</span>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={shuffleChoices}
            onChange={e => onShuffleChoices(e.target.checked)}
          />
          Losuj kolejność odpowiedzi
        </label>
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="primary" onClick={() => onStart(true)} disabled={selectedFiles.length === 0}>
          Losowa kolejność pytań
        </button>
        <button onClick={() => onStart(false)} disabled={selectedFiles.length === 0}>
          Kolejność z pliku
        </button>
      </div>
    </div>
  )
}
