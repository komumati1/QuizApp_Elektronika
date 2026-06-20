'use client'

import { useState, useEffect } from 'react'
import { Question, Choice } from '@/lib/types'
import { imageUrl } from '@/lib/imageUrl'
import EditModal from './EditModal'

interface Props {
  questions: Question[]
  currentIdx: number
  markedUids: string[]
  isRepeat: boolean
  readonly: boolean
  shuffleChoices: boolean
  onAnswer: (uid: string, correct: boolean) => void
  onMark: (uid: string, mark: boolean) => void
  onNext: () => void
  onUpdateQuestion: (q: Question) => Promise<void>
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function checkAnswer(q: Question, userAnswer: string | string[]): boolean {
  if (q.type === 'numeric') {
    const user = parseFloat(String(userAnswer).replace(',', '.'))
    if (isNaN(user)) return false
    const correct = q.answer.value as number
    const tol = q.answer.tolerance ?? 0.05
    if (correct === 0) return Math.abs(user) <= Math.abs(tol)
    return Math.abs(user - correct) / Math.abs(correct) <= tol
  }
  if (q.type === 'single_choice') {
    return String(userAnswer).trim().toUpperCase() === String(q.answer.value).trim().toUpperCase()
  }
  if (q.type === 'multi_choice') {
    const ua = [...(userAnswer as string[])].sort()
    const ca = [...(q.answer.value as string[])].sort()
    return ua.length === ca.length && ua.every((v, i) => v === ca[i])
  }
  return false
}

interface QState {
  userAnswer: string | string[]
  checked: boolean
  correct: boolean
  showHint: boolean
  showDiagram: boolean
  showSource: boolean
  diagImgError: boolean
  srcImgError: boolean
  displayChoices: Choice[] | null
}

function makeState(q: Question, doShuffle: boolean): QState {
  const displayChoices = q.choices
    ? (doShuffle ? shuffleArray(q.choices) : [...q.choices])
    : null
  return {
    userAnswer: q.type === 'multi_choice' ? [] : '',
    checked: false, correct: false,
    showHint: false, showDiagram: q.diagram.present,
    showSource: false, diagImgError: false, srcImgError: false,
    displayChoices,
  }
}

export default function QuizScreen({
  questions, currentIdx, markedUids, isRepeat, readonly, shuffleChoices,
  onAnswer, onMark, onNext, onUpdateQuestion,
}: Props) {
  const q = questions[currentIdx]
  const uid = q._uid!
  const [s, setS] = useState<QState>(() => makeState(q, shuffleChoices))
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    setS(makeState(q, shuffleChoices))
    setShowEdit(false)
  }, [currentIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  const isMarked = markedUids.includes(uid)
  const progress = ((currentIdx + 1) / questions.length) * 100
  const isUnsupported = !['numeric', 'single_choice', 'multi_choice'].includes(q.type)

  const handleCheck = () => {
    const correct = checkAnswer(q, s.userAnswer)
    setS(prev => ({ ...prev, checked: true, correct }))
    onAnswer(uid, correct)
  }

  const handleManualMark = (correct: boolean) => {
    setS(prev => ({ ...prev, checked: true, correct, showHint: true }))
    onAnswer(uid, correct)
  }

  const canCheck = () => {
    if (q.type === 'numeric') return (s.userAnswer as string).trim() !== ''
    if (q.type === 'single_choice') return (s.userAnswer as string) !== ''
    if (q.type === 'multi_choice') return (s.userAnswer as string[]).length > 0
    return false
  }

  const toggleMulti = (id: string) => {
    const arr = s.userAnswer as string[]
    setS(prev => ({
      ...prev,
      userAnswer: arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id],
    }))
  }

  const correctDisplay = (() => {
    const v = q.answer.value
    if (Array.isArray(v)) return v.join(', ')
    if (typeof v === 'object' && v !== null)
      return (v as Record<string, unknown>).description as string ?? JSON.stringify(v)
    return String(v)
  })()

  const srcLabel = (q._sourceFile?.replace('.json', '') ?? '') + '#' + q.id

  return (
    <div>
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="row" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 13, color: '#555' }}>
          Pytanie {currentIdx + 1} / {questions.length}
          {isRepeat && <span style={{ color: '#2a5298', marginLeft: 6 }}>(powtórka)</span>}
          <span style={{ color: '#bbb', marginLeft: 8, fontSize: 12 }}>[{srcLabel}]</span>
        </span>
        <div className="row" style={{ marginLeft: 'auto', gap: 6 }}>
          {isMarked && <span className="badge badge-marked">★ Problematyczne</span>}
          {q.answer.confirmed === false && <span className="badge badge-warn">⚠ Niesprawdzona</span>}
          {readonly && <span className="badge" style={{ background: '#eee', color: '#777', border: '1px solid #ccc' }}>tylko odczyt</span>}
        </div>
      </div>

      <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>Temat: {q.topic}</div>

      <div className="card">
        <p style={{ lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{q.question}</p>
        {q.answer.unit && (
          <p style={{ marginTop: 8, fontSize: 13, color: '#555' }}>Podaj wynik w [{q.answer.unit}]</p>
        )}
      </div>

      {q.diagram.present && (
        <div className="card">
          <div className="row" style={{ marginBottom: s.showDiagram ? 8 : 0 }}>
            <span className="label">Schemat</span>
            <button style={{ fontSize: 12, padding: '3px 10px' }}
              onClick={() => setS(prev => ({ ...prev, showDiagram: !prev.showDiagram }))}>
              {s.showDiagram ? 'Ukryj' : 'Pokaż schemat'}
            </button>
          </div>
          {s.showDiagram && (
            <>
              {q.diagram.image && !s.diagImgError && (
                <img className="source-img" src={imageUrl(q.diagram.image.source)} alt={q.diagram.image.alt}
                  onError={() => setS(prev => ({ ...prev, diagImgError: true }))} />
              )}
              {q.diagram.image && s.diagImgError && (
                <p style={{ fontSize: 12, color: '#b52020', marginTop: 4 }}>Nie znaleziono: {q.diagram.image.source}</p>
              )}
              {q.diagram.description && (
                <p style={{ marginTop: 8, fontSize: 13, color: '#444', lineHeight: 1.5 }}>{q.diagram.description}</p>
              )}
              {q.diagram.components.length > 0 && (
                <p style={{ marginTop: 4, fontSize: 12, color: '#666' }}>Elementy: {q.diagram.components.join(', ')}</p>
              )}
            </>
          )}
        </div>
      )}

      <div className="card">
        <div className="row">
          <span className="label">Oryginał</span>
          <button style={{ fontSize: 12, padding: '3px 10px' }}
            onClick={() => setS(prev => ({ ...prev, showSource: !prev.showSource, srcImgError: false }))}>
            {s.showSource ? 'Ukryj' : 'Pokaż oryginał'}
          </button>
          <span style={{ fontSize: 11, color: '#bbb', wordBreak: 'break-all', flex: 1 }}>{q.source_file}</span>
        </div>
        {s.showSource && (
          !s.srcImgError ? (
            <img className="source-img" src={imageUrl(q.source_file)} alt={'Źródło: ' + q.source_file}
              onError={() => setS(prev => ({ ...prev, srcImgError: true }))} />
          ) : (
            <p style={{ fontSize: 12, color: '#b52020', marginTop: 8 }}>
              Nie znaleziono: {q.source_file}
              {!readonly && <><br /><span style={{ color: '#777' }}>Popraw ścieżkę w „Edytuj pytanie".</span></>}
            </p>
          )
        )}
        {q.answer.confirmed === false && q.answer.confirmation_note && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#7d5a00', background: '#fffde7', border: '1px solid #fdd835', borderRadius: 3, padding: '6px 8px' }}>
            {q.answer.confirmation_note}
          </div>
        )}
      </div>

      <div className="card">
        <div className="label" style={{ marginBottom: 10 }}>Twoja odpowiedź</div>

        {isUnsupported && (
          <div>
            <p style={{ fontSize: 13, color: '#777', marginBottom: 10 }}>
              Typ: <strong>{q.type}</strong> — oceń ręcznie po przejrzeniu schematu i oryginału.
            </p>
            {!s.checked && (
              <div className="row">
                <button className="success" onClick={() => handleManualMark(true)}>✓ Poprawna</button>
                <button className="danger" onClick={() => handleManualMark(false)}>✗ Błędna</button>
              </div>
            )}
          </div>
        )}

        {!isUnsupported && q.type === 'numeric' && (
          <div className="row">
            <input type="text" inputMode="decimal" style={{ maxWidth: 200 }}
              placeholder="Wpisz wartość..." value={s.userAnswer as string} disabled={s.checked}
              onChange={e => setS(prev => ({ ...prev, userAnswer: e.target.value }))}
              onKeyDown={e => { if (e.key === 'Enter' && !s.checked && canCheck()) handleCheck() }} />
            {q.answer.unit && <span style={{ fontSize: 14 }}>{q.answer.unit}</span>}
          </div>
        )}

        {!isUnsupported && q.type === 'single_choice' && s.displayChoices && (
          <div>
            {s.displayChoices.map(c => (
              <label key={c.id} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10,
                cursor: s.checked ? 'default' : 'pointer', padding: '6px 8px', borderRadius: 3,
                background: s.checked && s.userAnswer === c.id ? (s.correct ? '#eafaf1' : '#fdf0f0') : undefined,
              }}>
                <input type="radio" name={`q_${uid}`} value={c.id} disabled={s.checked}
                  checked={s.userAnswer === c.id}
                  onChange={() => setS(prev => ({ ...prev, userAnswer: c.id }))}
                  style={{ marginTop: 3, flexShrink: 0 }} />
                <span>
                  <strong>{c.id}.</strong> {c.text}
                  {s.checked && c.id === String(q.answer.value) && <span className="correct" style={{ marginLeft: 8 }}>✓</span>}
                </span>
              </label>
            ))}
          </div>
        )}

        {!isUnsupported && q.type === 'multi_choice' && s.displayChoices && (
          <div>
            <p style={{ fontSize: 12, color: '#777', marginBottom: 8 }}>Zaznacz wszystkie poprawne:</p>
            {s.displayChoices.map(c => {
              const selected = (s.userAnswer as string[]).includes(c.id)
              const isCorrect = Array.isArray(q.answer.value) && (q.answer.value as string[]).includes(c.id)
              return (
                <label key={c.id} style={{
                  display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10,
                  cursor: s.checked ? 'default' : 'pointer', padding: '6px 8px', borderRadius: 3,
                  background: s.checked ? (isCorrect ? '#eafaf1' : selected ? '#fdf0f0' : undefined) : undefined,
                }}>
                  <input type="checkbox" value={c.id} disabled={s.checked} checked={selected}
                    onChange={() => !s.checked && toggleMulti(c.id)}
                    style={{ marginTop: 3, flexShrink: 0 }} />
                  <span>
                    <strong>{c.id}.</strong> {c.text}
                    {s.checked && isCorrect && <span className="correct" style={{ marginLeft: 8 }}>✓</span>}
                  </span>
                </label>
              )
            })}
          </div>
        )}

        {!isUnsupported && !s.checked && (
          <button className="primary" style={{ marginTop: 10 }} onClick={handleCheck} disabled={!canCheck()}>
            Sprawdź odpowiedź
          </button>
        )}
      </div>

      {s.checked && (
        <div className="card" style={{
          borderColor: s.correct ? '#1a6e2e' : '#b52020',
          background: s.correct ? '#f0fff4' : '#fff5f5',
        }}>
          <p style={{ fontSize: 16, marginBottom: 8 }}>
            {s.correct
              ? <span className="correct">✓ Poprawna odpowiedź!</span>
              : <span className="wrong">✗ Błędna odpowiedź</span>
            }
          </p>
          {!s.correct && !isUnsupported && (
            <div style={{ marginBottom: 8, fontSize: 14 }}>
              <strong>Poprawna:</strong>{' '}
              <span style={{ fontFamily: 'monospace' }}>
                {correctDisplay}{q.answer.unit ? ` ${q.answer.unit}` : ''}
              </span>
            </div>
          )}
          {q.type === 'numeric' && q.answer.tolerance != null && (
            <p style={{ fontSize: 12, color: '#777', marginBottom: 6 }}>
              Tolerancja ±{(q.answer.tolerance * 100).toFixed(0)}%
              {' '}({((q.answer.value as number) * (1 - q.answer.tolerance)).toFixed(3)} –{' '}
              {((q.answer.value as number) * (1 + q.answer.tolerance)).toFixed(3)}
              {q.answer.unit ? ` ${q.answer.unit}` : ''})
            </p>
          )}
          <button style={{ fontSize: 13, padding: '4px 10px', marginTop: 4 }}
            onClick={() => setS(prev => ({ ...prev, showHint: !prev.showHint }))}>
            {s.showHint ? 'Ukryj wskazówkę' : 'Pokaż wskazówkę'}
          </button>
          {s.showHint && (
            <div style={{ marginTop: 8, padding: '10px 12px', background: '#fffde7', border: '1px solid #fdd835', borderRadius: 3, fontSize: 13, fontFamily: 'monospace', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {q.hint}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="row">
          <button onClick={() => onMark(uid, !isMarked)}
            style={{ background: isMarked ? '#fff3e0' : undefined, borderColor: isMarked ? '#ff9800' : undefined }}>
            {isMarked ? '★ Oznaczone' : '☆ Oznacz jako problematyczne'}
          </button>
          {!readonly && (
            <button onClick={() => setShowEdit(true)}>Edytuj pytanie</button>
          )}
          {s.checked && (
            <button className="primary" style={{ marginLeft: 'auto' }} onClick={onNext}>
              {currentIdx < questions.length - 1 ? 'Następne →' : 'Zakończ →'}
            </button>
          )}
        </div>
      </div>

      {showEdit && !readonly && (
        <EditModal question={q} onSave={onUpdateQuestion} onClose={() => setShowEdit(false)} />
      )}
    </div>
  )
}
