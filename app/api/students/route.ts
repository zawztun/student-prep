import { NextRequest, NextResponse } from 'next/server';
import { StudentService } from '@/lib/database';
import { studentRegistrationSchema } from '@/lib/validations';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = studentRegistrationSchema.parse(body);
    
    // Check if student already exists
    const existingStudent = await StudentService.findByEmail(validatedData.email);
    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 409 }
      );
    }
    
    // Create new student
    const student = await StudentService.create(validatedData);
    
    return NextResponse.json({
      success: true,
      data: student,
      message: 'Student registered successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Student registration error:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const grade = searchParams.get('grade');
    const country = searchParams.get('country');
    
    const filters = {
      ...(grade && { grade: parseInt(grade) }),
      ...(country && { country }),
      ...(search && { search })
    };
    
    const result = await StudentService.findAll({
      page,
      limit,
      search: search || undefined,
      grade: grade ? parseInt(grade) : undefined,
      country: country || undefined
    });
    
    return NextResponse.json({
      success: true,
      data: result.students,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}