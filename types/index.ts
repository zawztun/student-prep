// Student types
export interface Student {
  id: string
  name: string
  email: string
  grade: number
  country: string
  state?: string | null
  emailPreference: boolean
  createdAt: Date
  updatedAt: Date
  studyPlan?: StudyPlan | null
}

// Study Plan types
export interface StudyPlan {
  id: string
  studentId: string
  schedule: string[] // Days of the week: ['Monday', 'Wednesday', 'Friday']
  channels: string[] // Delivery channels: ['Email', 'In-App'] or ['In-App']
  createdAt: Date
  updatedAt: Date
  student?: Student
}

// Question types
export interface Question {
  id: string
  text: string
  subject: Subject
  gradeMin: number
  gradeMax: number
  difficulty: Difficulty
  localeScope: string // 'US-CA', 'US', 'Global'
  explanation: string
  createdAt: Date
  updatedAt: Date
  choices: QuestionChoice[]
  analytics?: QuestionAnalytics | null
}

export interface QuestionChoice {
  id: string
  questionId: string
  text: string
  isCorrect: boolean
  order: number
  question?: Question
}

export interface QuestionAnalytics {
  id: string
  questionId: string
  totalAttempts: number
  correctAttempts: number
  averageTimeSpent: number // in seconds
  lastUsed: Date
  createdAt: Date
  updatedAt: Date
  question?: Question
}

// Assignment types
export interface Assignment {
  id: string
  studentId: string
  title: string
  description: string
  scheduledFor: Date
  status: AssignmentStatus
  createdAt: Date
  updatedAt: Date
  student?: Student
  questions: AssignmentQuestion[]
  submissions: AssignmentSubmission[]
}

export interface AssignmentQuestion {
  id: string
  assignmentId: string
  questionId: string
  order: number
  assignment?: Assignment
  question?: Question
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  questionId: string
  selectedChoiceId: string
  isCorrect: boolean
  timeSpent: number // in seconds
  submittedAt: Date
  assignment?: Assignment
  question?: Question
  selectedChoice?: QuestionChoice
}

// Weekly Report types
export interface WeeklyReport {
  id: string
  studentId: string
  weekStartDate: Date
  weekEndDate: Date
  totalAssignments: number
  completedAssignments: number
  averageScore: number
  totalTimeSpent: number // in minutes
  strongSubjects: Subject[]
  weakSubjects: Subject[]
  recommendations: string[]
  sentAt: Date
  createdAt: Date
  student?: Student
}

// Enums
export enum Subject {
  MATH = 'MATH',
  SCIENCE = 'SCIENCE',
  ENGLISH = 'ENGLISH',
  HISTORY = 'HISTORY',
  GEOGRAPHY = 'GEOGRAPHY',
  PHYSICS = 'PHYSICS',
  CHEMISTRY = 'CHEMISTRY',
  BIOLOGY = 'BIOLOGY'
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

export enum AssignmentStatus {
  SCHEDULED = 'SCHEDULED',
  DELIVERED = 'DELIVERED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Form types
export interface StudentRegistrationForm {
  name: string
  email: string
  grade: number
  country: string
  state?: string
  emailPreference: boolean
}

export interface EmailPreferenceForm {
  emailPreference: boolean
}

export interface QuestionGenerationForm {
  grade: number
  subject: Subject
  difficulty?: Difficulty
  count: number
  locale?: string
}

export interface QuestionForm {
  text: string
  subject: Subject
  gradeMin: number
  gradeMax: number
  difficulty: Difficulty
  localeScope: string
  explanation: string
  choices: {
    text: string
    isCorrect: boolean
  }[]
}

// Filter types
export interface QuestionFilters {
  subject?: Subject
  difficulty?: Difficulty
  gradeMin?: number
  gradeMax?: number
  localeScope?: string
  search?: string
}

export interface AssignmentFilters {
  status?: AssignmentStatus
  dateFrom?: Date
  dateTo?: Date
  subject?: Subject
}

// Country and State types
export interface Country {
  code: string
  name: string
  flag: string
  states?: State[]
}

export interface State {
  code: string
  name: string
  countryCode: string
}

// UI Component types
export interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

export interface TableColumn<T = any> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: any, row: T) => React.ReactNode
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showFirstLast?: boolean
}

// Error types
export interface ValidationError {
  field: string
  message: string
}

export interface ApiError {
  message: string
  code?: string
  statusCode?: number
  details?: ValidationError[]
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>