import { NextRequest, NextResponse } from 'next/server';
import { StudyPlanService, StudentService } from '@/lib/database';
import { studyPlanUpdateSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const studyPlan = await StudyPlanService.findByStudentId(params.studentId);
    
    if (!studyPlan) {
      return NextResponse.json(
        { error: 'Study plan not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: studyPlan
    });
    
  } catch (error) {
    console.error('Get study plan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = studyPlanUpdateSchema.parse(body);
    
    // Check if student exists
    const student = await StudentService.findById(params.studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    // Update study plan
    const updatedStudyPlan = await StudyPlanService.update(
      params.studentId,
      validatedData
    );
    
    if (!updatedStudyPlan) {
      return NextResponse.json(
        { error: 'Failed to update study plan' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedStudyPlan,
      message: 'Study plan updated successfully'
    });
    
  } catch (error) {
    console.error('Update study plan error:', error);
    
    if (error instanceof ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}