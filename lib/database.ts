import { db } from './db'

// Define enums locally until Prisma client is generated
export enum Subject {
  MATH = 'MATH',
  SCIENCE = 'SCIENCE',
  ENGLISH = 'ENGLISH',
  HISTORY = 'HISTORY',
  GEOGRAPHY = 'GEOGRAPHY',
  PHYSICS = 'PHYSICS',
  CHEMISTRY = 'CHEMISTRY',
  BIOLOGY = 'BIOLOGY',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum AssignmentStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

// Base types (will be replaced by Prisma types after generation)
export interface Student {
  id: string
  name: string
  email: string
  grade: number
  country: string
  state?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface StudyPlan {
  id: string
  studentId: string
  schedule: string[]
  channels: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Question {
  id: string
  text: string
  subject: Subject
  gradeMin: number
  gradeMax: number
  difficulty: Difficulty
  localeScope: string
  explanation: string
  createdAt: Date
  updatedAt: Date
}

export interface QuestionChoice {
  id: string
  questionId: string
  text: string
  isCorrect: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Assignment {
  id: string
  studentId: string
  title: string
  description: string
  status: AssignmentStatus
  scheduledFor: Date
  completedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface AssignmentSubmission {
  id: string
  assignmentId: string
  questionId: string
  selectedChoiceId: string
  timeSpent: number
  submittedAt: Date
}

export interface WeeklyReport {
  id: string
  studentId: string
  weekStartDate: Date
  weekEndDate: Date
  assignmentsCompleted: number
  averageScore: number
  totalTimeSpent: number
  subjectBreakdown: any
  improvementAreas: string[]
  achievements: string[]
  createdAt: Date
}

// Extended types with relations
export type StudentWithStudyPlan = Student & {
  studyPlan: StudyPlan | null
}

export type QuestionWithChoices = Question & {
  choices: QuestionChoice[]
}

export type AssignmentWithDetails = Assignment & {
  student: Student
  questions: ({
    question: QuestionWithChoices
  })[]
  submissions: AssignmentSubmission[]
}

export type WeeklyReportWithStudent = WeeklyReport & {
  student: Student
}

// Student Database Service
export class StudentService {
  static async create(data: {
    name: string
    email: string
    grade: number
    country: string
    state?: string
    emailPreference?: boolean
  }): Promise<StudentWithStudyPlan> {
    const student = await db.student.create({
      data: {
        name: data.name,
        email: data.email,
        grade: data.grade,
        country: data.country,
        state: data.state,
        studyPlan: {
          create: {
            schedule: ['Monday', 'Wednesday', 'Friday'], // Default schedule
            channels: data.emailPreference ? ['Email', 'In-App'] : ['In-App'],
          },
        },
      },
      include: {
        studyPlan: true,
      },
    })
    return student
  }

  static async findByEmail(email: string): Promise<Student | null> {
    return db.student.findUnique({
      where: { email },
    })
  }

  static async findById(id: string): Promise<StudentWithStudyPlan | null> {
    return db.student.findUnique({
      where: { id },
      include: {
        studyPlan: true,
      },
    })
  }

  static async findAll({
    page = 1,
    limit = 20,
    search,
    grade,
    country,
  }: {
    page?: number
    limit?: number
    search?: string
    grade?: number
    country?: string
  } = {}): Promise<{
    students: StudentWithStudyPlan[]
    total: number
    pages: number
  }> {
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    
    if (grade) {
      where.grade = grade
    }
    
    if (country) {
      where.country = country
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        include: {
          studyPlan: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.student.count({ where }),
    ])

    return {
      students,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  static async updateEmailPreference(
    id: string,
    emailPreference: boolean
  ): Promise<StudentWithStudyPlan | null> {
    const student = await db.student.findUnique({
      where: { id },
      include: { studyPlan: true },
    })

    if (!student || !student.studyPlan) {
      return null
    }

    // Update study plan channels based on email preference
    const channels = emailPreference
      ? ['Email', 'In-App']
      : student.studyPlan.channels.filter((channel: string) => channel !== 'Email')

    return db.student.update({
      where: { id },
      data: {
        studyPlan: {
          update: {
            channels,
          },
        },
      },
      include: {
        studyPlan: true,
      },
    })
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db.student.delete({
        where: { id },
      })
      return true
    } catch {
      return false
    }
  }
}

// Study Plan Database Service
export class StudyPlanService {
  static async update(
    studentId: string,
    data: {
      schedule?: string[]
      channels?: string[]
    }
  ): Promise<StudyPlan | null> {
    try {
      return await db.studyPlan.update({
        where: { studentId },
        data,
      })
    } catch {
      return null
    }
  }

  static async findByStudentId(studentId: string): Promise<StudyPlan | null> {
    return db.studyPlan.findUnique({
      where: { studentId },
    })
  }
}

// Question Database Service
export class QuestionService {
  static async create(data: {
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
  }): Promise<QuestionWithChoices> {
    return db.question.create({
      data: {
        text: data.text,
        subject: data.subject,
        gradeMin: data.gradeMin,
        gradeMax: data.gradeMax,
        difficulty: data.difficulty,
        localeScope: data.localeScope,
        explanation: data.explanation,
        choices: {
          create: data.choices,
        },
      },
      include: {
        choices: true,
      },
    })
  }

  static async findById(id: string): Promise<QuestionWithChoices | null> {
    return db.question.findUnique({
      where: { id },
      include: {
        choices: true,
      },
    })
  }

  static async findAll({
    page = 1,
    limit = 20,
    subject,
    difficulty,
    gradeMin,
    gradeMax,
    localeScope,
    search,
  }: {
    page?: number
    limit?: number
    subject?: Subject
    difficulty?: Difficulty
    gradeMin?: number
    gradeMax?: number
    localeScope?: string
    search?: string
  } = {}): Promise<{
    questions: QuestionWithChoices[]
    total: number
    pages: number
  }> {
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (subject) {
      where.subject = subject
    }
    
    if (difficulty) {
      where.difficulty = difficulty
    }
    
    if (gradeMin) {
      where.gradeMin = { gte: gradeMin }
    }
    
    if (gradeMax) {
      where.gradeMax = { lte: gradeMax }
    }
    
    if (localeScope) {
      where.localeScope = localeScope
    }
    
    if (search) {
      where.OR = [
        { text: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [questions, total] = await Promise.all([
      db.question.findMany({
        where,
        include: {
          choices: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      db.question.count({ where }),
    ])

    return {
      questions,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  static async findForStudent({
    grade,
    subject,
    difficulty,
    count = 10,
    localeScope = 'en-US',
  }: {
    grade: number
    subject: Subject
    difficulty?: Difficulty
    count?: number
    localeScope?: string
  }): Promise<QuestionWithChoices[]> {
    const where: any = {
      subject,
      gradeMin: { lte: grade },
      gradeMax: { gte: grade },
    }
    
    if (difficulty) {
      where.difficulty = difficulty
    }
    
    // Try to find questions for the specific locale first
    let questions = await db.question.findMany({
      where: {
        ...where,
        localeScope,
      },
      include: {
        choices: true,
      },
      take: count,
      orderBy: { createdAt: 'desc' },
    })
    
    // If not enough questions found, fallback to broader locale scopes
    if (questions.length < count) {
      const fallbackLocales = this.buildLocaleFallback(localeScope)
      
      for (const locale of fallbackLocales) {
        if (questions.length >= count) break
        
        const additionalQuestions = await db.question.findMany({
          where: {
            ...where,
            localeScope: locale,
            id: { notIn: questions.map((q: any) => q.id) },
          },
          include: {
            choices: true,
          },
          take: count - questions.length,
          orderBy: { createdAt: 'desc' },
        })
        
        questions = [...questions, ...additionalQuestions]
      }
    }
    
    return questions.slice(0, count)
  }

  static buildLocaleFallback(locale: string): string[] {
    const fallbacks = []
    
    // If locale is 'en-US', fallback to 'en', then 'global'
    if (locale.includes('-')) {
      const [language] = locale.split('-')
      fallbacks.push(language)
    }
    
    fallbacks.push('global')
    
    return fallbacks
  }

  static async update(
    id: string,
    data: Partial<{
      text: string
      subject: Subject
      gradeMin: number
      gradeMax: number
      difficulty: Difficulty
      localeScope: string
      explanation: string
    }>
  ): Promise<QuestionWithChoices | null> {
    try {
      return await db.question.update({
        where: { id },
        data,
        include: {
          choices: true,
        },
      })
    } catch {
      return null
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      await db.question.delete({
        where: { id },
      })
      return true
    } catch {
      return false
    }
  }
}

// Assignment Database Service
export class AssignmentService {
  static async create(data: {
    studentId: string
    title: string
    description: string
    scheduledFor: Date
    questionIds: string[]
  }): Promise<AssignmentWithDetails> {
    return db.assignment.create({
      data: {
        studentId: data.studentId,
        title: data.title,
        description: data.description,
        scheduledFor: data.scheduledFor,
        status: 'SCHEDULED',
        questions: {
          create: data.questionIds.map((questionId, index) => ({
            questionId,
            order: index + 1,
          })),
        },
      },
      include: {
        student: true,
        questions: {
          include: {
            question: {
              include: {
                choices: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        submissions: true,
      },
    })
  }

  static async findById(id: string): Promise<AssignmentWithDetails | null> {
    return db.assignment.findUnique({
      where: { id },
      include: {
        student: true,
        questions: {
          include: {
            question: {
              include: {
                choices: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        submissions: true,
      },
    })
  }

  static async findByStudentId(
    studentId: string,
    {
      page = 1,
      limit = 20,
      status,
    }: {
      page?: number
      limit?: number
      status?: AssignmentStatus
    } = {}
  ): Promise<{
    assignments: AssignmentWithDetails[]
    total: number
    pages: number
  }> {
    const skip = (page - 1) * limit
    
    const where: any = { studentId }
    
    if (status) {
      where.status = status
    }

    const [assignments, total] = await Promise.all([
      db.assignment.findMany({
        where,
        include: {
          student: true,
          questions: {
            include: {
              question: {
                include: {
                  choices: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
          submissions: true,
        },
        skip,
        take: limit,
        orderBy: { scheduledFor: 'desc' },
      }),
      db.assignment.count({ where }),
    ])

    return {
      assignments,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  static async updateStatus(
    id: string,
    status: AssignmentStatus
  ): Promise<Assignment | null> {
    try {
      return await db.assignment.update({
        where: { id },
        data: { status },
      })
    } catch {
      return null
    }
  }

  static async findScheduledAssignments(): Promise<Assignment[]> {
    return db.assignment.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledFor: {
          lte: new Date(),
        },
      },
      include: {
        student: true,
      },
    })
  }
}

// Assignment Submission Database Service
export class AssignmentSubmissionService {
  static async create(data: {
    assignmentId: string
    questionId: string
    selectedChoiceId: string
    timeSpent: number
  }): Promise<AssignmentSubmission> {
    return db.assignmentSubmission.create({
      data,
    })
  }

  static async findByAssignmentId(
    assignmentId: string
  ): Promise<AssignmentSubmission[]> {
    return db.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        question: {
          include: {
            choices: true,
          },
        },
      },
    })
  }

  static async calculateScore(
    assignmentId: string
  ): Promise<{ score: number; totalQuestions: number; correctAnswers: number }> {
    const submissions = await db.assignmentSubmission.findMany({
      where: { assignmentId },
      include: {
        question: {
          include: {
            choices: true,
          },
        },
      },
    })

    const totalQuestions = submissions.length
    let correctAnswers = 0

    for (const submission of submissions) {
      const correctChoice = submission.question.choices.find(
        (choice: any) => choice.isCorrect
      )
      if (correctChoice && correctChoice.id === submission.selectedChoiceId) {
        correctAnswers++
      }
    }

    const score = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0

    return {
      score: Math.round(score * 100) / 100, // Round to 2 decimal places
      totalQuestions,
      correctAnswers,
    }
  }
}

// Weekly Report Database Service
export class WeeklyReportService {
  static async create(data: {
    studentId: string
    weekStartDate: Date
    weekEndDate: Date
    assignmentsCompleted: number
    averageScore: number
    totalTimeSpent: number
    subjectBreakdown: any
    improvementAreas: string[]
    achievements: string[]
  }): Promise<WeeklyReport> {
    return db.weeklyReport.create({
      data,
    })
  }

  static async findByStudentId(
    studentId: string,
    {
      page = 1,
      limit = 20,
    }: {
      page?: number
      limit?: number
    } = {}
  ): Promise<{
    reports: WeeklyReportWithStudent[]
    total: number
    pages: number
  }> {
    const skip = (page - 1) * limit

    const [reports, total] = await Promise.all([
      db.weeklyReport.findMany({
        where: { studentId },
        include: {
          student: true,
        },
        skip,
        take: limit,
        orderBy: { weekStartDate: 'desc' },
      }),
      db.weeklyReport.count({ where: { studentId } }),
    ])

    return {
      reports,
      total,
      pages: Math.ceil(total / limit),
    }
  }

  static async generateWeeklyReport(
    studentId: string,
    weekStartDate: Date,
    weekEndDate: Date
  ): Promise<WeeklyReport | null> {
    // Get all completed assignments for the week
    const assignments = await db.assignment.findMany({
      where: {
        studentId,
        status: 'COMPLETED',
        completedAt: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
      include: {
        submissions: {
          include: {
            question: {
              include: {
                choices: true,
              },
            },
          },
        },
      },
    })

    if (assignments.length === 0) {
      return null
    }

    // Calculate metrics
    const assignmentsCompleted = assignments.length
    let totalScore = 0
    let totalTimeSpent = 0
    const subjectBreakdown: Record<string, { correct: number; total: number }> = {}

    for (const assignment of assignments) {
      const { score } = await AssignmentSubmissionService.calculateScore(assignment.id)
      totalScore += score
      
      for (const submission of assignment.submissions) {
        totalTimeSpent += submission.timeSpent
        
        const subject = submission.question.subject
        if (!subjectBreakdown[subject]) {
          subjectBreakdown[subject] = { correct: 0, total: 0 }
        }
        
        subjectBreakdown[subject].total++
        
        const correctChoice = submission.question.choices.find((c: any) => c.isCorrect)
        if (correctChoice && correctChoice.id === submission.selectedChoiceId) {
          subjectBreakdown[subject].correct++
        }
      }
    }

    const averageScore = totalScore / assignmentsCompleted
    
    // Generate improvement areas and achievements
    const improvementAreas: string[] = []
    const achievements: string[] = []
    
    Object.entries(subjectBreakdown).forEach(([subject, data]) => {
      const percentage = (data.correct / data.total) * 100
      if (percentage < 70) {
        improvementAreas.push(`${subject}: ${percentage.toFixed(1)}% accuracy`)
      } else if (percentage >= 90) {
        achievements.push(`Excellent performance in ${subject}: ${percentage.toFixed(1)}% accuracy`)
      }
    })
    
    if (averageScore >= 90) {
      achievements.push(`Outstanding overall performance: ${averageScore.toFixed(1)}% average score`)
    }
    
    if (assignmentsCompleted >= 5) {
      achievements.push(`Consistent study habit: Completed ${assignmentsCompleted} assignments this week`)
    }

    return this.create({
      studentId,
      weekStartDate,
      weekEndDate,
      assignmentsCompleted,
      averageScore,
      totalTimeSpent,
      subjectBreakdown,
      improvementAreas,
      achievements,
    })
  }
}

// Analytics and Reporting
export class AnalyticsService {
  static async getStudentStats(studentId: string): Promise<{
    totalAssignments: number
    completedAssignments: number
    averageScore: number
    totalTimeSpent: number
    subjectPerformance: Record<string, { score: number; count: number }>
  }> {
    const assignments = await db.assignment.findMany({
      where: { studentId },
      include: {
        submissions: {
          include: {
            question: {
              include: {
                choices: true,
              },
            },
          },
        },
      },
    })

    const totalAssignments = assignments.length
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED').length
    
    let totalScore = 0
    let totalTimeSpent = 0
    const subjectPerformance: Record<string, { score: number; count: number }> = {}

    for (const assignment of assignments.filter((a: any) => a.status === 'COMPLETED')) {
      const { score } = await AssignmentSubmissionService.calculateScore(assignment.id)
      totalScore += score
      
      for (const submission of assignment.submissions) {
        totalTimeSpent += submission.timeSpent
        
        const subject = submission.question.subject
        if (!subjectPerformance[subject]) {
          subjectPerformance[subject] = { score: 0, count: 0 }
        }
        
        const correctChoice = submission.question.choices.find(c => c.isCorrect)
        const isCorrect = correctChoice && correctChoice.id === submission.selectedChoiceId
        
        subjectPerformance[subject].score += isCorrect ? 100 : 0
        subjectPerformance[subject].count++
      }
    }

    // Calculate averages
    Object.keys(subjectPerformance).forEach(subject => {
      const data = subjectPerformance[subject]
      data.score = data.count > 0 ? data.score / data.count : 0
    })

    const averageScore = completedAssignments > 0 ? totalScore / completedAssignments : 0

    return {
      totalAssignments,
      completedAssignments,
      averageScore,
      totalTimeSpent,
      subjectPerformance,
    }
  }

  static async getSystemStats(): Promise<{
    totalStudents: number
    totalQuestions: number
    totalAssignments: number
    averageCompletionRate: number
  }> {
    const [totalStudents, totalQuestions, totalAssignments, completedAssignments] = await Promise.all([
      db.student.count(),
      db.question.count(),
      db.assignment.count(),
      db.assignment.count({ where: { status: 'COMPLETED' } }),
    ])

    const averageCompletionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0

    return {
      totalStudents,
      totalQuestions,
      totalAssignments,
      averageCompletionRate,
    }
  }
}