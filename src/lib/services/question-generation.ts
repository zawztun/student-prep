import { prisma } from '@/lib/prisma'

// Define enums to match Prisma schema
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

export interface QuestionGenerationParams {
  subject: Subject
  difficulty: Difficulty
  count: number
  studentCountry?: string
  studentRegion?: string
  excludeQuestionIds?: string[]
}

export interface GeneratedQuestion {
  id: string
  stem: string
  subject: Subject
  difficulty: Difficulty
  localeScope: string
  tags: string[]
  choices: {
    id: string
    text: string
    isCorrect: boolean
    explanation?: string
    order: number
  }[]
}

export class QuestionGenerationService {
  /**
   * Generate questions based on parameters with localization priority
   */
  async generateQuestions(params: QuestionGenerationParams): Promise<GeneratedQuestion[]> {
    const {
      subject,
      difficulty,
      count,
      studentCountry,
      studentRegion,
      excludeQuestionIds = []
    } = params

    // Build locale hierarchy for question selection priority
    const localeHierarchy = this.buildLocaleHierarchy(studentCountry, studentRegion)
    
    const selectedQuestions: GeneratedQuestion[] = []
    let remainingCount = count

    // Try to get questions from each locale scope in priority order
    for (const scope of localeHierarchy) {
      if (remainingCount <= 0) break

      const questions = await this.findQuestionsByScope(
        subject,
        difficulty,
        scope,
        remainingCount,
        [...excludeQuestionIds, ...selectedQuestions.map(q => q.id)]
      )

      const randomQuestions = this.selectRandomQuestions(questions, remainingCount)
      selectedQuestions.push(...randomQuestions)
      remainingCount -= randomQuestions.length
    }

    // If we still need more questions, get any available questions
    if (remainingCount > 0) {
      const additionalQuestions = await this.findQuestionsByScope(
        subject,
        difficulty,
        null, // Any scope
        remainingCount,
        [...excludeQuestionIds, ...selectedQuestions.map(q => q.id)]
      )

      const randomAdditional = this.selectRandomQuestions(additionalQuestions, remainingCount)
      selectedQuestions.push(...randomAdditional)
    }

    return selectedQuestions
  }

  /**
   * Build locale hierarchy for question selection priority
   * Priority: Region -> Country -> Global
   */
  private buildLocaleHierarchy(studentCountry?: string, studentRegion?: string): Array<{
    scope: string
  }> {
    const hierarchy = []

    // Highest priority: Region-specific questions
    if (studentRegion && studentCountry) {
      hierarchy.push({
        scope: `STATE:${studentCountry}-${studentRegion}`
      })
    }

    // Medium priority: Country-specific questions
    if (studentCountry) {
      hierarchy.push({
        scope: `COUNTRY:${studentCountry}`
      })
    }

    // Lowest priority: Global questions
    hierarchy.push({
      scope: 'GLOBAL'
    })

    return hierarchy
  }

  /**
   * Find questions by locale scope with filtering
   */
  private async findQuestionsByScope(
    subject: Subject,
    difficulty: Difficulty,
    scope: {
      scope: string
    } | null,
    limit: number,
    excludeIds: string[]
  ): Promise<GeneratedQuestion[]> {
    const where: any = {
      subject,
      difficulty,
      isActive: true,
      id: {
        notIn: excludeIds
      }
    }

    if (scope) {
      where.localeScope = scope.scope
    }

    const questions = await prisma.question.findMany({
      where,
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      },
      take: limit * 2 // Get more than needed for randomization
    })

    return questions.map((q: any) => ({
      id: q.id,
      stem: q.stem,
      subject: q.subject as Subject,
      difficulty: q.difficulty as Difficulty,
      localeScope: q.localeScope,
      countryCode: q.countryCode || undefined,
      regionCode: q.regionCode || undefined,
      tags: q.tags,
      choices: q.choices.map((c: any) => ({
        id: c.id,
        text: c.text,
        isCorrect: c.isCorrect,
        explanation: c.explanation || undefined,
        order: c.order
      }))
    }))
  }

  /**
   * Randomly select questions from available pool
   */
  private selectRandomQuestions(
    questions: GeneratedQuestion[],
    count: number
  ): GeneratedQuestion[] {
    if (questions.length <= count) {
      return questions
    }

    // Fisher-Yates shuffle algorithm
    const shuffled = [...questions]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    return shuffled.slice(0, count)
  }

  /**
   * Update question analytics after usage
   */
  async updateQuestionAnalytics(
    questionId: string,
    isCorrect: boolean,
    timeSpent: number
  ): Promise<void> {
    await prisma.$transaction(async (tx: typeof prisma) => {
      const analytics = await tx.questionAnalytics.findUnique({
        where: { questionId }
      })

      if (!analytics) {
        // Create new analytics record
        await tx.questionAnalytics.create({
          data: {
            questionId,
            timesUsed: 1,
            correctRate: isCorrect ? 1 : 0,
            avgTimeSpent: timeSpent,
            lastUsed: new Date()
          }
        })
      } else {
        // Update existing analytics
        const newTimesUsed = analytics.timesUsed + 1
        const newCorrectCount = isCorrect 
          ? Math.round(analytics.correctRate * analytics.timesUsed) + 1
          : Math.round(analytics.correctRate * analytics.timesUsed)
        const newCorrectRate = newCorrectCount / newTimesUsed
        const newAvgTimeSpent = (
          (analytics.avgTimeSpent * analytics.timesUsed) + timeSpent
        ) / newTimesUsed

        await tx.questionAnalytics.update({
          where: { questionId },
          data: {
            timesUsed: newTimesUsed,
            correctRate: newCorrectRate,
            avgTimeSpent: Math.round(newAvgTimeSpent),
            lastUsed: new Date()
          }
        })
      }
    })
  }

  /**
   * Get question analytics for admin dashboard
   */
  async getQuestionAnalytics(questionId?: string) {
    if (questionId) {
      return await prisma.questionAnalytics.findUnique({
        where: { questionId },
        include: {
          question: {
            select: {
              stem: true,
              subject: true,
              difficulty: true,
              localeScope: true
            }
          }
        }
      })
    }

    return await prisma.questionAnalytics.findMany({
      include: {
        question: {
          select: {
            stem: true,
            subject: true,
            difficulty: true,
            localeScope: true
          }
        }
      },
      orderBy: { timesUsed: 'desc' },
      take: 100
    })
  }
}

export const questionGenerationService = new QuestionGenerationService()