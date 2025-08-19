import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService, StudentService } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    // Check if student exists
    const student = await StudentService.findById(params.studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    // Get student analytics
    const stats = await AnalyticsService.getStudentStats(params.studentId);
    
    return NextResponse.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('Get student analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}