import { NextRequest, NextResponse } from 'next/server'
import { questionGenerationService, Subject, Difficulty } from '@/lib/services/question-generation'
import { z } from 'zod'

const generateQuestionsSchema = z.object({
  subject: z.enum(['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  count: z.number().int().min(1).max(50),
  studentCountry: z.string().optional(),
  studentRegion: z.string().optional(),
  excludeQuestionIds: z.array(z.string()).optional()
})

// POST /api/questions/generate - Generate questions for students
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const params = generateQuestionsSchema.parse(body)
    
    const questions = await questionGenerationService.generateQuestions({
      subject: params.subject as Subject,
      difficulty: params.difficulty as Difficulty,
      count: params.count,
      studentCountry: params.studentCountry,
      studentRegion: params.studentRegion,
      excludeQuestionIds: params.excludeQuestionIds
    })
    
    return NextResponse.json({
      questions,
      count: questions.length,
      requestedCount: params.count,
      localization: {
        country: params.studentCountry,
        region: params.studentRegion
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Generate questions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}