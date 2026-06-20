import { useState, useEffect } from 'react'
import { QuizData, Question, SourceInfo } from './types'
import StartScreen from './components/StartScreen'
import QuizScreen from './components/QuizScreen'
import ResultsScreen from './components/ResultsScreen'

type Phase = 'loading' | 'start' | 'quiz' | 'results'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App() {
  const [sources, setSources] = useState<SourceInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [data, setData] = useState<QuizData | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [wrongUids, setWrongUids] = useState<string[]>([])
  const [markedUids, setMarkedUids] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRepeat, setIsRepeat] = useState(false)

  // Load available source files
  useEffect(() => {
    fetch('/api/sources')
      .then(r => r.json())
      .then((s: SourceInfo[]) => {
        setSources(s)
        setSelectedFiles(s.map(f => f.filename)) // select all by default
        setPhase('start')
      })
      .catch(e => {
        setError('Nie można połączyć z serwerem: ' + String(e))
        setPhase('start')
      })
  }, [])

  const loadQuestions = async (files: string[]): Promise<QuizData> => {
    const params = files.length > 0 ? `?files=${files.join(',')}` : ''
    const r = await fetch('/api/questions' + params)
    if (!r.ok) throw new Error('HTTP ' + r.status)
    return r.json()
  }

  const startQuiz = async (randomize: boolean) => {
    try {
      const d = await loadQuestions(selectedFiles)
      setData(d)
      const qs = randomize ? shuffle(d.questions) : [...d.questions]
      setSessionQuestions(qs)
      setCurrentIdx(0)
      setWrongUids([])
      setMarkedUids([])
      setIsRepeat(false)
      setPhase('quiz')
    } catch (e) {
      setError('Błąd ładowania pytań: ' + String(e))
    }
  }

  const startRepeat = async (uidsToRepeat: string[]) => {
    if (!data) return
    const repeatQs = shuffle(data.questions.filter(q => uidsToRepeat.includes(q._uid!)))
    setSessionQuestions(repeatQs)
    setCurrentIdx(0)
    setWrongUids([])
    setIsRepeat(true)
    setPhase('quiz')
  }

  const handleAnswer = (uid: string, correct: boolean) => {
    if (!correct) {
      setWrongUids(prev => prev.includes(uid) ? prev : [...prev, uid])
    } else {
      setWrongUids(prev => prev.filter(u => u !== uid))
    }
  }

  const handleMark = (uid: string, mark: boolean) => {
    setMarkedUids(prev =>
      mark ? (prev.includes(uid) ? prev : [...prev, uid]) : prev.filter(u => u !== uid)
    )
  }

  const handleNext = () => {
    if (currentIdx < sessionQuestions.length - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      setPhase('results')
    }
  }

  const handleUpdateQuestion = async (updated: Question) => {
    if (!data) return
    const filename = updated._sourceFile!
    const r = await fetch(`/api/question/${filename}/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (!r.ok) throw new Error('Save failed')
    const newQuestions = data.questions.map(q => q._uid === updated._uid ? updated : q)
    setData({ ...data, questions: newQuestions })
    setSessionQuestions(prev => prev.map(q => q._uid === updated._uid ? updated : q))
  }

  if (phase === 'loading') {
    return <div style={{ padding: 32 }}>Ładowanie...</div>
  }

  if (phase === 'start') {
    return (
      <StartScreen
        sources={sources}
        selectedFiles={selectedFiles}
        onSelectFiles={setSelectedFiles}
        error={error}
        onStart={startQuiz}
      />
    )
  }

  if (phase === 'quiz') {
    return (
      <QuizScreen
        questions={sessionQuestions}
        currentIdx={currentIdx}
        markedUids={markedUids}
        isRepeat={isRepeat}
        onAnswer={handleAnswer}
        onMark={handleMark}
        onNext={handleNext}
        onUpdateQuestion={handleUpdateQuestion}
      />
    )
  }

  // results
  return (
    <ResultsScreen
      wrongUids={wrongUids}
      markedUids={markedUids}
      sessionTotal={sessionQuestions.length}
      allQuestions={data?.questions ?? []}
      onRepeat={startRepeat}
      onNewQuiz={() => setPhase('start')}
    />
  )
}
