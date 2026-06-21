'use client'

import { useState } from 'react'
import { Question } from '@/lib/types'

interface Props {
  question: Question
  onSave: (updated: Question) => Promise<void>
  onClose: () => void
}

export default function EditModal({ question: initial, onSave, onClose }: Props) {
  const [q, setQ] = useState<Question>(JSON.parse(JSON.stringify(initial)))
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const set = <K extends keyof Question>(key: K, val: Question[K]) =>
    setQ(prev => ({ ...prev, [key]: val }))

  const setAns = (field: string, val: unknown) =>
    setQ(prev => ({ ...prev, answer: { ...prev.answer, [field]: val } }))

  const handleSave = async () => {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave(q)
      onClose()
    } catch (e) {
      setSaveError('Błąd zapisu: ' + String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        <div className="row" style={{ marginBottom: 12 }}>
          <h3>Edytuj pytanie #{q.id}</h3>
          <button style={{ marginLeft: 'auto', padding: '4px 10px' }} onClick={onClose}>✕</button>
        </div>

        <div className="field">
          <label>Temat</label>
          <input type="text" value={q.topic} onChange={e => set('topic', e.target.value)} />
        </div>

        <div className="field">
          <label>Treść pytania</label>
          <textarea rows={5} value={q.question} onChange={e => set('question', e.target.value)} />
        </div>

        <div className="field">
          <label>Plik źródłowy (source_file)</label>
          <input type="text" value={q.source_file} onChange={e => set('source_file', e.target.value)} />
        </div>

        {q.diagram.present && q.diagram.image && (
          <>
            <hr />
            <h3 style={{ marginBottom: 8 }}>Schemat</h3>
            <div className="field">
              <label>Ścieżka obrazu schematu (diagram.image.source)</label>
              <input
                type="text"
                value={q.diagram.image.source}
                onChange={e => setQ(prev => ({
                  ...prev,
                  diagram: {
                    ...prev.diagram,
                    image: { ...prev.diagram.image!, source: e.target.value },
                  },
                }))}
              />
            </div>
          </>
        )}

        <hr />
        <h3 style={{ marginBottom: 8 }}>Odpowiedź</h3>

        {q.type === 'numeric' && (
          <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
            <div className="field" style={{ flex: 2 }}>
              <label>Wartość</label>
              <input type="number" step="any" value={String(q.answer.value)}
                onChange={e => setAns('value', parseFloat(e.target.value))} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Jednostka</label>
              <input type="text" value={q.answer.unit ?? ''}
                onChange={e => setAns('unit', e.target.value || null)} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Tolerancja (0.05 = 5%)</label>
              <input type="number" step="any" value={String(q.answer.tolerance ?? 0.05)}
                onChange={e => setAns('tolerance', parseFloat(e.target.value))} />
            </div>
          </div>
        )}

        {(q.type === 'single_choice' || q.type === 'multi_choice') && q.choices && (
          <>
            <div style={{ marginBottom: 10 }}>
              <p className="label" style={{ marginBottom: 6 }}>Opcje</p>
              {q.choices.map((c, i) => (
                <div key={c.id} className="row" style={{ marginBottom: 6 }}>
                  <span style={{ minWidth: 28, fontWeight: 700, fontSize: 14 }}>{c.id}.</span>
                  <input type="text" value={c.text} style={{ flex: 1 }}
                    onChange={e => {
                      const choices = q.choices!.map((ch, ci) =>
                        ci === i ? { ...ch, text: e.target.value } : ch
                      )
                      setQ(prev => ({ ...prev, choices }))
                    }} />
                </div>
              ))}
            </div>
            <div className="field">
              <label>
                Poprawna odpowiedź
                {q.type === 'multi_choice' ? ' (rozdziel przecinkami, np. A,C,E)' : ' (np. B)'}
              </label>
              <input type="text"
                value={Array.isArray(q.answer.value) ? q.answer.value.join(',') : String(q.answer.value)}
                onChange={e => {
                  const raw = e.target.value.toUpperCase()
                  setAns('value', q.type === 'multi_choice'
                    ? raw.split(',').map(s => s.trim()).filter(Boolean)
                    : raw.trim()
                  )
                }} />
            </div>
          </>
        )}

        <div className="field" style={{ marginTop: 4 }}>
          <label>Potwierdzona?</label>
          <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={q.answer.confirmed ?? false}
              onChange={e => setAns('confirmed', e.target.checked)} />
            Tak, odpowiedź jest potwierdzona
          </label>
        </div>

        <div className="field">
          <label>Notatka potwierdzenia</label>
          <textarea rows={2} value={q.answer.confirmation_note ?? ''}
            onChange={e => setAns('confirmation_note', e.target.value || undefined)} />
        </div>

        <hr />

        <div className="field">
          <label>Wskazówka</label>
          <textarea rows={3} value={q.hint} onChange={e => set('hint', e.target.value)} />
        </div>

        {saveError && <p className="wrong" style={{ marginBottom: 8, fontSize: 13 }}>{saveError}</p>}

        <div className="row">
          <button className="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Zapisywanie...' : 'Zapisz'}
          </button>
          <button onClick={onClose}>Anuluj</button>
        </div>
      </div>
    </div>
  )
}
