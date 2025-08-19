import { NextRequest, NextResponse } from 'next/server'
import { questionGenerationService } from '@/lib/services/question-generation'
import { z } from 'zod'

const updateAnalyticsSchema = z.object({
  questionId: z.string(),
  isCorrect: z.boolean(),
  timeSpent: z.number().int().min(0) // Time in seconds
})

const batchUpdateAnalyticsSchema = z.object({
  analytics: z.array(updateAnalyticsSchema).min(1).max(50)
})

// POST /api/questions/analytics - Update question analytics
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Check if it's a batch update or single update
    if (body.analytics) {
      // Batch update
      const { analytics } = batchUpdateAnalyticsSchema.parse(body)
      
      const results = await Promise.allSettled(
        analytics.map(item => 
          questionGenerationService.updateQuestionAnalytics(
            item.questionId,
            item.isCorrect,
            item.timeSpent
          )
        )
      )
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return NextResponse.json({
        message: `Updated analytics for ${successful} questions`,
        successful,
        failed,
        total: analytics.length
      })
    } else {
      // Single update
      const { questionId, isCorrect, timeSpent } = updateAnalyticsSchema.parse(body)
      
      await questionGenerationService.updateQuestionAnalytics(
        questionId,
        isCorrect,
        timeSpent
      )
      
      return NextResponse.json({
        message: 'Analytics updated successfully',
        questionId
      })
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Update analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/questions/analytics - Get question analytics (optional questionId query param)
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const questionId = url.searchParams.get('questionId')
    
    const analytics = await questionGenerationService.getQuestionAnalytics(
      questionId || undefined
    )
    
    return NextResponse.json({
      analytics,
      questionId: questionId || null
    })
  } catch (error) {
    console.error('Get analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}