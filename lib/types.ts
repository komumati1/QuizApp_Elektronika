export interface DiagramImage {
  source: string
  alt: string
}

export interface Diagram {
  present: boolean
  image: DiagramImage | null
  description: string | null
  components: string[]
}

export interface Choice {
  id: string
  text: string
}

export interface QuestionAnswer {
  value: number | string | string[] | Record<string, unknown>
  unit: string | null
  tolerance: number | null
  confirmed?: boolean
  confirmation_note?: string
}

export interface Question {
  id: number
  source_file: string
  type: 'numeric' | 'single_choice' | 'multi_choice' | 'matching' | string
  topic: string
  question: string
  diagram: Diagram
  choices: Choice[] | null
  answer: QuestionAnswer
  hint: string
  // Computed when loading — not stored in JSON
  _uid?: string
  _sourceFile?: string
}

export interface QuizMetadata {
  subject: string
  course: string
  semester?: string
  source_dir?: string
  extracted_at?: string
  total_questions: number
  schema_version?: string
  notes?: string[]
  file_note?: string
}

export interface QuizData {
  metadata: QuizMetadata
  questions: Question[]
}

export interface SourceInfo {
  filename: string
  metadata: QuizMetadata | null
  questionCount: number
}
