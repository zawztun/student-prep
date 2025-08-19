# Release 3.0: Study Scheduling & Assignment Delivery
## Detailed Implementation Plan

### Overview
Release 3.0 completes the core functionality of the Student Prep Web Application by implementing automated study scheduling, assignment delivery, auto-grading, and comprehensive reporting. This release transforms the platform into a fully automated learning system.

### Epic 3: Study Scheduling & Assignment Delivery

#### Story 3.1: Automated Study Session Scheduling
**Implementation Details:**

**Database Schema Extensions (Prisma):**
```prisma
model Assignment {
  id          String            @id @default(cuid())
  studentId   String
  title       String            @default("Weekly Practice Session")
  status      AssignmentStatus  @default(PENDING)
  scheduledAt DateTime
  startedAt   DateTime?
  completedAt DateTime?
  expiresAt   DateTime?
  score       Float?            // 0.0 to 1.0
  letterGrade String?           // A, B, C, D, F
  timeSpent   Int?              // in seconds
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  // Relations
  student     Student           @relation(fields: [studentId], references: [id], onDelete: Cascade)
  questions   AssignmentQuestion[]
  submissions AssignmentSubmission[]
  
  @@index([studentId, status])
  @@index([scheduledAt])
  @@map("assignments")
}

model AssignmentQuestion {
  id           String     @id @default(cuid())
  assignmentId String
  questionId   String
  order        Int        @db.SmallInt
  
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  question     Question   @relation(fields: [questionId], references: [id])
  
  @@unique([assignmentId, order])
  @@map("assignment_questions")
}

model AssignmentSubmission {
  id           String     @id @default(cuid())
  assignmentId String
  questionId   String
  selectedChoiceId String?
  isCorrect    Boolean?
  timeSpent    Int?       // in seconds
  submittedAt  DateTime   @default(now())
  
  assignment   Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  question     Question   @relation(fields: [questionId], references: [id])
  choice       QuestionChoice? @relation(fields: [selectedChoiceId], references: [id])
  
  @@unique([assignmentId, questionId])
  @@map("assignment_submissions")
}

model WeeklyReport {
  id              String   @id @default(cuid())
  studentId       String
  weekStartDate   DateTime
  weekEndDate     DateTime
  assignmentsCompleted Int @default(0)
  totalQuestions  Int      @default(0)
  correctAnswers  Int      @default(0)
  averageScore    Float?
  letterGrade     String?
  timeSpent       Int?     // total time in seconds
  subjectBreakdown Json    // {MATH: {correct: 5, total: 8}, SCIENCE: {...}}
  weakAreas       String[] // ["algebra", "geometry"]
  recommendations String[] // ["Focus on algebra practice", "Review geometry basics"]
  emailSent       Boolean  @default(false)
  emailSentAt     DateTime?
  createdAt       DateTime @default(now())
  
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  
  @@unique([studentId, weekStartDate])
  @@index([weekStartDate])
  @@map("weekly_reports")
}

enum AssignmentStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  EXPIRED
}
```

**Scheduling Service (Vercel Cron Jobs):**
```typescript
// app/api/cron/create-assignments/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const assignmentService = new AssignmentSchedulingService();
    const result = await assignmentService.createScheduledAssignments();
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Assignment creation failed:', error);
    return NextResponse.json(
      { error: 'Assignment creation failed' },
      { status: 500 }
    );
  }
}

class AssignmentSchedulingService {
  async createScheduledAssignments(): Promise<AssignmentCreationResult> {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    
    // Get all active study plans for today's schedule
    const studyPlans = await prisma.studyPlan.findMany({
      where: {
        isActive: true,
        schedule: {
          path: ['days'],
          array_contains: dayName
        }
      },
      include: {
        student: true
      }
    });
    
    const results = {
      created: 0,
      failed: 0,
      skipped: 0,
      errors: [] as string[]
    };
    
    for (const plan of studyPlans) {
      try {
        // Check if assignment already exists for today
        const existingAssignment = await this.checkExistingAssignment(
          plan.studentId,
          today
        );
        
        if (existingAssignment) {
          results.skipped++;
          continue;
        }
        
        // Generate questions for the student
        const questions = await this.generateQuestionsForStudent(plan.student);
        
        if (questions.length === 0) {
          // Schedule retry for later
          await this.scheduleRetry(plan.studentId, today);
          results.failed++;
          results.errors.push(`No questions available for student ${plan.studentId}`);
          continue;
        }
        
        // Create assignment
        const assignment = await this.createAssignment(plan.student, questions);
        
        // Send email if enabled
        if (plan.channels.includes('EMAIL')) {
          await this.sendAssignmentEmail(plan.student, assignment);
        }
        
        results.created++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed for student ${plan.studentId}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  private async generateQuestionsForStudent(student: Student): Promise<Question[]> {
    const questionService = new QuestionGenerationService();
    
    try {
      return await questionService.generateQuestions({
        studentGrade: student.grade,
        country: student.country,
        state: student.state,
        count: 5
      });
    } catch (error) {
      console.error(`Question generation failed for student ${student.id}:`, error);
      return [];
    }
  }
  
  private async createAssignment(student: Student, questions: Question[]): Promise<Assignment> {
    const scheduledTime = this.getScheduledTime(student);
    const expirationTime = new Date(scheduledTime.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return await prisma.assignment.create({
      data: {
        studentId: student.id,
        scheduledAt: scheduledTime,
        expiresAt: expirationTime,
        questions: {
          create: questions.map((question, index) => ({
            questionId: question.id,
            order: index + 1
          }))
        }
      },
      include: {
        questions: {
          include: {
            question: {
              include: {
                choices: true
              }
            }
          }
        }
      }
    });
  }
}
```

**Email Service Integration:**
```typescript
class AssignmentEmailService {
  private resend = new Resend(process.env.RESEND_API_KEY);
  
  async sendAssignmentEmail(student: Student, assignment: Assignment): Promise<void> {
    const emailContent = await this.generateEmailContent(student, assignment);
    
    try {
      await this.resend.emails.send({
        from: 'StudyPrep <noreply@studyprep.com>',
        to: student.email,
        subject: `Your Weekly Practice Session is Ready! 📚`,
        html: emailContent.html,
        text: emailContent.text
      });
      
      // Log email sent
      await prisma.emailLog.create({
        data: {
          studentId: student.id,
          assignmentId: assignment.id,
          type: 'ASSIGNMENT_DELIVERY',
          status: 'SENT',
          sentAt: new Date()
        }
      });
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Log email failure and schedule retry
      await prisma.emailLog.create({
        data: {
          studentId: student.id,
          assignmentId: assignment.id,
          type: 'ASSIGNMENT_DELIVERY',
          status: 'FAILED',
          error: error.message,
          retryCount: 0
        }
      });
      
      throw error;
    }
  }
  
  private async generateEmailContent(student: Student, assignment: Assignment) {
    const questions = assignment.questions.map(aq => aq.question);
    
    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1>Hi ${student.name}! 👋</h1>
          <p>Your weekly practice session is ready with ${questions.length} questions tailored for Grade ${student.grade}.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2>This Week's Focus:</h2>
            <ul>
              ${questions.map(q => `<li>${q.subject}: ${q.stem.substring(0, 50)}...</li>`).join('')}
            </ul>
          </div>
          
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/assignments/${assignment.id}" 
             style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Start Practice Session
          </a>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            This assignment expires on ${assignment.expiresAt?.toLocaleDateString()}. 
            Good luck with your studies!
          </p>
        </div>
      `,
      text: `Hi ${student.name}! Your weekly practice session is ready...`
    };
  }
}
```

#### Story 3.2: In-App Assignment Access
**Implementation Details:**

**API Endpoints:**

1. **GET /api/students/:id/assignments**
   - Query: `?status=PENDING&page=1&limit=10`
   - Response:
     ```json
     {
       "success": true,
       "data": {
         "assignments": [
           {
             "id": "assign_123",
             "title": "Weekly Practice Session",
             "status": "PENDING",
             "scheduledAt": "2024-01-15T09:00:00Z",
             "expiresAt": "2024-01-22T09:00:00Z",
             "questionCount": 5,
             "estimatedTime": 15,
             "subjects": ["MATH", "SCIENCE"]
           }
         ],
         "pagination": {
           "page": 1,
           "limit": 10,
           "total": 3,
           "hasNext": false
         }
       }
     }
     ```

2. **GET /api/assignments/:id**
   - Response:
     ```json
     {
       "success": true,
       "data": {
         "id": "assign_123",
         "title": "Weekly Practice Session",
         "status": "PENDING",
         "questions": [
           {
             "id": "q1",
             "order": 1,
             "stem": "What is 2 + 2?",
             "subject": "MATH",
             "choices": [
               {"id": "c1", "text": "3", "order": 1},
               {"id": "c2", "text": "4", "order": 2}
             ]
           }
         ],
         "timeLimit": 900, // 15 minutes in seconds
         "startedAt": null,
         "submissions": []
       }
     }
     ```

3. **POST /api/assignments/:id/start**
   - Marks assignment as IN_PROGRESS
   - Records start time
   - Returns assignment with timer information

4. **POST /api/assignments/:id/submit**
   - Request Body:
     ```json
     {
       "submissions": [
         {
           "questionId": "q1",
           "selectedChoiceId": "c2",
           "timeSpent": 30
         }
       ]
     }
     ```
   - Response includes immediate grading results

**Frontend Components:**

1. **AssignmentDashboard.tsx**
   - List of pending/completed assignments
   - Progress indicators
   - Quick stats (completion rate, average score)

2. **AssignmentPlayer.tsx**
   - Question navigation
   - Timer display
   - Progress bar
   - Auto-save functionality

3. **AssignmentResults.tsx**
   - Immediate feedback after submission
   - Correct/incorrect indicators
   - Explanations for each question
   - Performance summary

### Auto-Grading System

**Grading Service:**
```typescript
class AutoGradingService {
  async gradeAssignment(assignmentId: string, submissions: SubmissionData[]): Promise<GradingResult> {
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        questions: {
          include: {
            question: {
              include: {
                choices: true
              }
            }
          }
        }
      }
    });
    
    if (!assignment) {
      throw new Error('Assignment not found');
    }
    
    const gradingResults = [];
    let totalCorrect = 0;
    let totalQuestions = assignment.questions.length;
    
    for (const submission of submissions) {
      const questionData = assignment.questions.find(
        aq => aq.questionId === submission.questionId
      );
      
      if (!questionData) continue;
      
      const correctChoice = questionData.question.choices.find(c => c.isCorrect);
      const isCorrect = submission.selectedChoiceId === correctChoice?.id;
      
      if (isCorrect) totalCorrect++;
      
      // Save submission
      await prisma.assignmentSubmission.create({
        data: {
          assignmentId,
          questionId: submission.questionId,
          selectedChoiceId: submission.selectedChoiceId,
          isCorrect,
          timeSpent: submission.timeSpent
        }
      });
      
      gradingResults.push({
        questionId: submission.questionId,
        isCorrect,
        correctChoiceId: correctChoice?.id,
        selectedChoiceId: submission.selectedChoiceId,
        explanation: correctChoice?.explanation
      });
    }
    
    // Calculate scores
    const score = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
    const letterGrade = this.calculateLetterGrade(score);
    
    // Update assignment
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        score,
        letterGrade
      }
    });
    
    // Update question analytics
    await this.updateQuestionAnalytics(gradingResults);
    
    return {
      score,
      letterGrade,
      totalCorrect,
      totalQuestions,
      results: gradingResults
    };
  }
  
  private calculateLetterGrade(score: number): string {
    if (score >= 0.9) return 'A';
    if (score >= 0.8) return 'B';
    if (score >= 0.7) return 'C';
    if (score >= 0.6) return 'D';
    return 'F';
  }
  
  private async updateQuestionAnalytics(results: QuestionResult[]): Promise<void> {
    for (const result of results) {
      await prisma.questionAnalytics.upsert({
        where: { questionId: result.questionId },
        update: {
          timesUsed: { increment: 1 },
          correctRate: {
            // Recalculate based on all submissions
          },
          lastUsed: new Date()
        },
        create: {
          questionId: result.questionId,
          timesUsed: 1,
          correctRate: result.isCorrect ? 1.0 : 0.0,
          lastUsed: new Date()
        }
      });
    }
  }
}
```

### Weekly Reporting System

**Report Generation Service:**
```typescript
// app/api/cron/generate-reports/route.ts
class WeeklyReportService {
  async generateWeeklyReports(): Promise<ReportGenerationResult> {
    const lastFriday = this.getLastFriday();
    const weekStart = new Date(lastFriday.getTime() - 6 * 24 * 60 * 60 * 1000);
    
    // Get all students who had assignments in the past week
    const studentsWithAssignments = await prisma.student.findMany({
      where: {
        assignments: {
          some: {
            scheduledAt: {
              gte: weekStart,
              lte: lastFriday
            }
          }
        }
      },
      include: {
        assignments: {
          where: {
            scheduledAt: {
              gte: weekStart,
              lte: lastFriday
            }
          },
          include: {
            submissions: {
              include: {
                question: true
              }
            }
          }
        }
      }
    });
    
    const results = {
      generated: 0,
      emailed: 0,
      failed: 0,
      errors: [] as string[]
    };
    
    for (const student of studentsWithAssignments) {
      try {
        const reportData = await this.calculateWeeklyStats(student, weekStart, lastFriday);
        const report = await this.createWeeklyReport(student.id, reportData);
        
        if (student.receiveEmail) {
          await this.sendWeeklyReportEmail(student, report);
          results.emailed++;
        }
        
        results.generated++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed for student ${student.id}: ${error.message}`);
      }
    }
    
    return results;
  }
  
  private async calculateWeeklyStats(
    student: StudentWithAssignments,
    weekStart: Date,
    weekEnd: Date
  ): Promise<WeeklyReportData> {
    const assignments = student.assignments;
    const completedAssignments = assignments.filter(a => a.status === 'COMPLETED');
    
    let totalQuestions = 0;
    let correctAnswers = 0;
    let totalTimeSpent = 0;
    const subjectBreakdown: Record<string, {correct: number, total: number}> = {};
    const incorrectTopics: string[] = [];
    
    for (const assignment of completedAssignments) {
      for (const submission of assignment.submissions) {
        totalQuestions++;
        if (submission.isCorrect) correctAnswers++;
        if (submission.timeSpent) totalTimeSpent += submission.timeSpent;
        
        const subject = submission.question.subject;
        if (!subjectBreakdown[subject]) {
          subjectBreakdown[subject] = { correct: 0, total: 0 };
        }
        subjectBreakdown[subject].total++;
        if (submission.isCorrect) {
          subjectBreakdown[subject].correct++;
        } else {
          // Add to weak areas
          submission.question.tags.forEach(tag => {
            if (!incorrectTopics.includes(tag)) {
              incorrectTopics.push(tag);
            }
          });
        }
      }
    }
    
    const averageScore = totalQuestions > 0 ? correctAnswers / totalQuestions : 0;
    const letterGrade = this.calculateLetterGrade(averageScore);
    
    return {
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      assignmentsCompleted: completedAssignments.length,
      totalQuestions,
      correctAnswers,
      averageScore,
      letterGrade,
      timeSpent: totalTimeSpent,
      subjectBreakdown,
      weakAreas: incorrectTopics.slice(0, 5), // Top 5 weak areas
      recommendations: this.generateRecommendations(subjectBreakdown, incorrectTopics)
    };
  }
  
  private generateRecommendations(
    subjectBreakdown: Record<string, {correct: number, total: number}>,
    weakAreas: string[]
  ): string[] {
    const recommendations = [];
    
    // Subject-specific recommendations
    for (const [subject, stats] of Object.entries(subjectBreakdown)) {
      const accuracy = stats.correct / stats.total;
      if (accuracy < 0.7) {
        recommendations.push(`Focus on ${subject} - current accuracy: ${Math.round(accuracy * 100)}%`);
      }
    }
    
    // Topic-specific recommendations
    if (weakAreas.length > 0) {
      recommendations.push(`Review these topics: ${weakAreas.slice(0, 3).join(', ')}`);
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('Great job! Keep up the consistent practice.');
    }
    
    return recommendations;
  }
}
```

### Performance Optimization

#### Caching Strategy
- Assignment data caching for active sessions
- Question content caching with Redis
- Report data caching for dashboard views
- Email template caching

#### Database Optimization
- Indexes for assignment queries
- Partitioning for large submission tables
- Archiving old assignment data
- Query optimization for reporting

#### Background Job Processing
- Queue system for email sending
- Batch processing for report generation
- Retry mechanisms for failed operations
- Job monitoring and alerting

### Testing Strategy

#### Unit Tests
- Grading algorithm accuracy
- Report calculation logic
- Email content generation
- Scheduling logic

#### Integration Tests
- End-to-end assignment flow
- Email delivery testing
- Database transaction integrity
- Cron job execution

#### Performance Tests
- Concurrent assignment submissions
- Report generation under load
- Email sending capacity
- Database query performance

### Security & Compliance

#### Data Protection
- Student data encryption
- Secure assignment delivery
- Audit trails for all operations
- COPPA compliance for minors

#### System Security
- Rate limiting for API endpoints
- Input validation and sanitization
- Secure cron job authentication
- Email security (SPF, DKIM)

### Deployment Checklist

#### Cron Jobs Setup
- [ ] Vercel cron job configuration
- [ ] Environment variables for scheduling
- [ ] Monitoring and alerting setup
- [ ] Backup scheduling mechanisms

#### Email Service
- [ ] Resend API configuration
- [ ] Email templates testing
- [ ] Delivery monitoring setup
- [ ] Bounce/complaint handling

#### Performance Monitoring
- [ ] Database performance metrics
- [ ] API response time monitoring
- [ ] Email delivery rates
- [ ] User engagement analytics

### Success Metrics
- Assignment completion rate > 85%
- Email delivery success rate > 99%
- Average grading time < 1 second
- Report generation time < 30 seconds
- Student engagement retention > 80%

### Dependencies
- Vercel Cron Jobs for scheduling
- Resend for email delivery
- Redis for caching
- Background job processing system
- Analytics and monitoring tools

### Timeline
- **Week 1:** Assignment creation and scheduling system
- **Week 2:** Auto-grading and immediate feedback
- **Week 3:** Weekly reporting and email delivery
- **Week 4:** Performance optimization and monitoring

This comprehensive implementation completes the Student Prep Web Application with a fully automated learning system that provides personalized, scheduled practice sessions with immediate feedback and detailed progress tracking.