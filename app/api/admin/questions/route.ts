import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth/admin'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createQuestionSchema = z.object({
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
})

const querySchema = z.object({
  page: z.string().transform(val => parseInt(val) || 1),
  limit: z.string().transform(val => Math.min(parseInt(val) || 20, 100)),
  subject: z.string().optional(),
  difficulty: z.string().optional(),
  localeScope: z.string().optional(),
  search: z.string().optional(),
  isActive: z.string().transform(val => val === 'true' ? true : val === 'false' ? false : undefined).optional()
})

// GET /api/admin/questions - List questions with pagination and filtering
export async function GET(request: NextRequest) {
  const authResult = await requireAdminAuth(request)
  if (authResult instanceof Response) return authResult
  
  try {
    const url = new URL(request.url)
    const params = Object.fromEntries(url.searchParams.entries())
    const { page, limit, subject, difficulty, localeScope, search, isActive } = querySchema.parse(params)
    
    const where: any = {}
    
    if (subject) where.subject = subject
    if (difficulty) where.difficulty = difficulty
    if (localeScope) where.localeScope = localeScope
    if (isActive !== undefined) where.isActive = isActive
    if (search) {
      where.OR = [
        { stem: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ]
    }
    
    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        where,
        include: {
          choices: {
            orderBy: { order: 'asc' }
          },
          analytics: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.question.count({ where })
    ])
    
    return NextResponse.json({
      questions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Get questions error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/questions - Create a new question
export async function POST(request: NextRequest) {
  const authResult = await requireAdminAuth(request)
  if (authResult instanceof Response) return authResult
  
  const admin = authResult
  
  try {
    const body = await request.json()
    const data = createQuestionSchema.parse(body)
    
    // Validate that exactly one choice is correct
    const correctChoices = data.choices.filter(choice => choice.isCorrect)
    if (correctChoices.length !== 1) {
      return NextResponse.json(
        { error: 'Exactly one choice must be marked as correct' },
        { status: 400 }
      )
    }
    
    // Validate locale scope requirements
    if (data.localeScope === 'COUNTRY' && !data.countryCode) {
      return NextResponse.json(
        { error: 'Country code is required for COUNTRY locale scope' },
        { status: 400 }
      )
    }
    
    if (data.localeScope === 'REGION' && !data.regionCode) {
      return NextResponse.json(
        { error: 'Region code is required for REGION locale scope' },
        { status: 400 }
      )
    }
    
    const question = await prisma.question.create({
      data: {
        stem: data.stem,
        subject: data.subject,
        difficulty: data.difficulty,
        localeScope: data.localeScope,
        countryCode: data.countryCode,
        regionCode: data.regionCode,
        tags: data.tags,
        createdBy: admin.id,
        choices: {
          create: data.choices
        }
      },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      }
    })
    
    // Create initial analytics record
    await prisma.questionAnalytics.create({
      data: {
        questionId: question.id,
        timesUsed: 0,
        correctRate: 0,
        avgTimeSpent: 0
      }
    })
    
    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Create question error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}