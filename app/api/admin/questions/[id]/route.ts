import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateQuestionSchema = z.object({
  stem: z.string().min(1).optional(),
  subject: z.enum(['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  localeScope: z.enum(['GLOBAL', 'COUNTRY', 'REGION']).optional(),
  countryCode: z.string().optional(),
  regionCode: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  choices: z.array(z.object({
    id: z.string().optional(), // For existing choices
    text: z.string().min(1),
    isCorrect: z.boolean(),
    explanation: z.string().optional(),
    order: z.number().int().min(1)
  })).min(2).max(6).optional()
})

// GET /api/admin/questions/[id] - Get a specific question
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminAuth(request)
  if (authResult instanceof Response) return authResult
  
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        },
        analytics: true
      }
    })
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(question)
  } catch (error) {
    console.error('Get question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/questions/[id] - Update a question
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminAuth(request)
  if (authResult instanceof Response) return authResult
  
  try {
    const body = await request.json()
    const data = updateQuestionSchema.parse(body)
    
    // Check if question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: params.id },
      include: { choices: true }
    })
    
    if (!existingQuestion) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }
    
    // Validate choices if provided
    if (data.choices) {
      const correctChoices = data.choices.filter(choice => choice.isCorrect)
      if (correctChoices.length !== 1) {
        return NextResponse.json(
          { error: 'Exactly one choice must be marked as correct' },
          { status: 400 }
        )
      }
    }
    
    // Validate locale scope requirements
    const localeScope = data.localeScope || existingQuestion.localeScope
    if (localeScope === 'COUNTRY' && !data.countryCode && !existingQuestion.countryCode) {
      return NextResponse.json(
        { error: 'Country code is required for COUNTRY locale scope' },
        { status: 400 }
      )
    }
    
    if (localeScope === 'REGION' && !data.regionCode && !existingQuestion.regionCode) {
      return NextResponse.json(
        { error: 'Region code is required for REGION locale scope' },
        { status: 400 }
      )
    }
    
    // Update question with transaction
    const updatedQuestion = await prisma.$transaction(async (tx: typeof prisma) => {
      // Update the question
      const question = await tx.question.update({
        where: { id: params.id },
        data: {
          stem: data.stem,
          subject: data.subject,
          difficulty: data.difficulty,
          localeScope: data.localeScope,
          countryCode: data.countryCode,
          regionCode: data.regionCode,
          tags: data.tags,
          isActive: data.isActive,
          updatedAt: new Date()
        }
      })
      
      // Update choices if provided
      if (data.choices) {
        // Delete existing choices
        await tx.questionChoice.deleteMany({
          where: { questionId: params.id }
        })
        
        // Create new choices
        await tx.questionChoice.createMany({
          data: data.choices.map(choice => ({
            questionId: params.id,
            text: choice.text,
            isCorrect: choice.isCorrect,
            explanation: choice.explanation,
            order: choice.order
          }))
        })
      }
      
      return question
    })
    
    // Fetch the complete updated question
    const completeQuestion = await prisma.question.findUnique({
      where: { id: params.id },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        },
        analytics: true
      }
    })
    
    return NextResponse.json(completeQuestion)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/questions/[id] - Soft delete a question
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdminAuth(request)
  if (authResult instanceof Response) return authResult
  
  try {
    const question = await prisma.question.findUnique({
      where: { id: params.id }
    })
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      )
    }
    
    // Soft delete by setting isActive to false
    await prisma.question.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    })
    
    return NextResponse.json({ message: 'Question deleted successfully' })
  } catch (error) {
    console.error('Delete question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}