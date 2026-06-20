import { Question } from '../types'

interface Props {
  wrongUids: string[]
  markedUids: string[]
  sessionTotal: number
  allQuestions: Question[]
  onRepeat: (uids: string[]) => void
  onNewQuiz: () => void
}

export default function ResultsScreen({ wrongUids, markedUids, sessionTotal, allQuestions, onRepeat, onNewQuiz }: Props) {
  const correctCount = sessionTotal - wrongUids.length
  const toRepeat = [...new Set([...wrongUids, ...markedUids])]
  const getQ = (uid: string) => allQuestions.find(q => q._uid === uid)

  const renderQuestion = (uid: string) => {
    const q = getQ(uid)
    if (!q) return null
    const src = q._sourceFile?.replace('.json', '') ?? ''
    return (
      <li key={uid} style={{ marginBottom: 4, fontSize: 14 }}>
        <span style={{ color: '#999', marginRight: 6, fontSize: 12 }}>[{src}#{q.id}]</span>
        {q.topic}
      </li>
    )
  }

  return (
    <div>
      <h2>Wyniki quizu</h2>

      <div className="card">
        <p style={{ fontSize: 18, marginBottom: 6 }}>
          <span className="correct">{correctCount}</span>
          <span style={{ color: '#555' }}> / {sessionTotal} poprawnych</span>
        </p>
        {wrongUids.length === 0
          ? <p className="correct">Wszystkie odpowiedzi poprawne!</p>
          : <p className="wrong">{wrongUids.length} błędnych</p>
        }
        {markedUids.length > 0 && (
          <p style={{ marginTop: 4, color: '#a05000' }}>
            {markedUids.length} oznaczonych jako problematyczne
          </p>
        )}
      </div>

      {wrongUids.length > 0 && (
        <div className="card">
          <h3 className="wrong" style={{ marginBottom: 8 }}>Błędne odpowiedzi</h3>
          <ul style={{ paddingLeft: 18 }}>{wrongUids.map(renderQuestion)}</ul>
        </div>
      )}

      {markedUids.length > 0 && (
        <div className="card">
          <h3 style={{ color: '#a05000', marginBottom: 8 }}>Oznaczone jako problematyczne</h3>
          <ul style={{ paddingLeft: 18 }}>{markedUids.map(renderQuestion)}</ul>
        </div>
      )}

      <div className="row" style={{ marginTop: 14 }}>
        {toRepeat.length > 0 && (
          <button className="primary" onClick={() => onRepeat(toRepeat)}>
            Powtórz błędne i oznaczone ({toRepeat.length})
          </button>
        )}
        <button onClick={onNewQuiz}>Nowy quiz</button>
      </div>
    </div>
  )
}
