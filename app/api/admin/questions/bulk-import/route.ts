import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bulkImportSchema = z.object({
  questions: z.array(z.object({
    stem: z.string().min(1),
    subject: z.enum(['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
    localeScope: z.enum(['GLOBAL', 'COUNTRY', 'REGION']),
    countryCode: z.string().optional(),
    regionCode: z.string().optional(),
    tags: z.array(z.string()).default([]),
    choices: z.array(z.object({
      text: z.string().min(1),
      isCorrect: z.boolean(),
      explanation: z.string().optional(),
      order: z.number().int().min(1)
    })).min(2).max(6)
  })).min(1).max(100) // Limit to 100 questions per import
})

// POST /api/admin/questions/bulk-import - Import multiple questions
export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request)
  if (authResult instanceof Response) return authResult
  
  const admin = authResult
  
  try {
    const body = await request.json()
    const { questions } = bulkImportSchema.parse(body)
    
    // Validate each question
    const validationErrors: string[] = []
    
    questions.forEach((question, index) => {
      // Validate that exactly one choice is correct
      const correctChoices = question.choices.filter(choice => choice.isCorrect)
      if (correctChoices.length !== 1) {
        validationErrors.push(`Question ${index + 1}: Exactly one choice must be marked as correct`)
      }
      
      // Validate locale scope requirements
      if (question.localeScope === 'COUNTRY' && !question.countryCode) {
        validationErrors.push(`Question ${index + 1}: Country code is required for COUNTRY locale scope`)
      }
      
      if (question.localeScope === 'REGION' && !question.regionCode) {
        validationErrors.push(`Question ${index + 1}: Region code is required for REGION locale scope`)
      }
      
      // Validate choice orders are unique
      const orders = question.choices.map(c => c.order)
      const uniqueOrders = new Set(orders)
      if (orders.length !== uniqueOrders.size) {
        validationErrors.push(`Question ${index + 1}: Choice orders must be unique`)
      }
    })
    
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      )
    }
    
    // Import questions in transaction
    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const createdQuestions = []
      const errors = []
      
      for (let i = 0; i < questions.length; i++) {
        const questionData = questions[i]
        
        try {
          const question = await tx.question.create({
            data: {
              stem: questionData.stem,
              subject: questionData.subject,
              difficulty: questionData.difficulty,
              localeScope: questionData.localeScope,
              countryCode: questionData.countryCode,
              regionCode: questionData.regionCode,
              tags: questionData.tags,
              createdBy: admin.id,
              choices: {
                create: questionData.choices
              }
            },
            include: {
              choices: {
                orderBy: { order: 'asc' }
              }
            }
          })
          
          // Create initial analytics record
          await tx.questionAnalytics.create({
            data: {
              questionId: question.id,
              timesUsed: 0,
              correctRate: 0,
              avgTimeSpent: 0
            }
          })
          
          createdQuestions.push(question)
        } catch (error) {
          console.error(`Error creating question ${i + 1}:`, error)
          errors.push(`Question ${i + 1}: Failed to create question`)
        }
      }
      
      return { createdQuestions, errors }
    })
    
    const response: any = {
      message: `Successfully imported ${result.createdQuestions.length} questions`,
      imported: result.createdQuestions.length,
      total: questions.length
    }
    
    if (result.errors.length > 0) {
      response.errors = result.errors
      response.message += ` with ${result.errors.length} errors`
    }
    
    const statusCode = result.errors.length > 0 ? 207 : 201 // 207 Multi-Status for partial success
    
    return NextResponse.json(response, { status: statusCode })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Bulk import error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}