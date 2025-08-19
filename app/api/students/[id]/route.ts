import { NextRequest, NextResponse } from 'next/server';
import { StudentService } from '@/lib/database';
import { emailPreferenceSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await StudentService.findById(params.id);
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: student
    });
    
  } catch (error) {
    console.error('Get student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    // Check if student exists
    const existingStudent = await StudentService.findById(params.id);
    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    // Handle email preference update
    if ('emailPreference' in body) {
      const validatedData = emailPreferenceSchema.parse(body);
      const updatedStudent = await StudentService.updateEmailPreference(
        params.id,
        validatedData.emailPreference
      );
      
      return NextResponse.json({
        success: true,
        data: updatedStudent,
        message: 'Email preference updated successfully'
      });
    }
    
    return NextResponse.json(
      { error: 'No valid fields to update' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Update student error:', error);
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await StudentService.findById(params.id);
    
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }
    
    const deleted = await StudentService.delete(params.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}