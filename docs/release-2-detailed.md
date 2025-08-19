# Release 2.0: Question Management & Generation
## Detailed Implementation Plan

### Overview
Release 2.0 builds upon the student enrollment foundation to implement a comprehensive question management system with localized content generation. This release focuses on creating, managing, and intelligently serving practice questions based on student profiles.

### Epic 2: Question Management & Generation

#### Story 2.1: Localized Question Generation
**Implementation Details:**

**Database Schema (Prisma):**
```prisma
model Question {
  id            String         @id @default(cuid())
  stem          String         @db.Text
  subject       Subject
  gradeMin      Int            @db.SmallInt
  gradeMax      Int            @db.SmallInt
  localeScope   String         @db.VarChar(20) // GLOBAL, COUNTRY:US, STATE:US-NY
  difficulty    Difficulty     @default(MEDIUM)
  tags          String[]       // ["algebra", "equations", "word-problems"]
  isActive      Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  createdBy     String?        // Admin user ID
  
  // Relations
  choices       QuestionChoice[]
  assignments   AssignmentQuestion[]
  analytics     QuestionAnalytics[]
  
  @@index([subject, gradeMin, gradeMax])
  @@index([localeScope])
  @@index([isActive])
  @@map("questions")
}

model QuestionChoice {
  id          String   @id @default(cuid())
  questionId  String
  text        String   @db.Text
  isCorrect   Boolean  @default(false)
  explanation String?  @db.Text
  order       Int      @db.SmallInt
  
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  @@unique([questionId, order])
  @@map("question_choices")
}

model QuestionAnalytics {
  id           String   @id @default(cuid())
  questionId   String
  timesUsed    Int      @default(0)
  correctRate  Float    @default(0.0)
  avgTimeSpent Int?     // in seconds
  lastUsed     DateTime?
  
  question     Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  
  @@unique([questionId])
  @@map("question_analytics")
}

enum Subject {
  MATH
  SCIENCE
  ENGLISH
  HISTORY
  GEOGRAPHY
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

**Question Generation Service:**
```typescript
interface QuestionGenerationParams {
  studentGrade: number;
  country: string;
  state?: string;
  subject?: Subject;
  difficulty?: Difficulty;
  count?: number;
  excludeIds?: string[];
}

class QuestionGenerationService {
  async generateQuestions(params: QuestionGenerationParams): Promise<Question[]> {
    const { studentGrade, country, state, count = 5 } = params;
    
    // Build locale hierarchy for fallback
    const localeScopes = this.buildLocaleHierarchy(country, state);
    
    // Try each locale scope until we find enough questions
    for (const scope of localeScopes) {
      const questions = await this.findQuestionsByScope(
        scope,
        studentGrade,
        params
      );
      
      if (questions.length >= count) {
        return this.selectRandomQuestions(questions, count);
      }
    }
    
    throw new Error('Insufficient questions available for student profile');
  }
  
  private buildLocaleHierarchy(country: string, state?: string): string[] {
    const hierarchy = ['GLOBAL'];
    
    if (country) {
      hierarchy.unshift(`COUNTRY:${country}`);
    }
    
    if (state && country === 'US') {
      hierarchy.unshift(`STATE:${country}-${state}`);
    }
    
    return hierarchy;
  }
  
  private async findQuestionsByScope(
    scope: string,
    grade: number,
    params: QuestionGenerationParams
  ): Promise<Question[]> {
    return await prisma.question.findMany({
      where: {
        localeScope: scope,
        gradeMin: { lte: grade },
        gradeMax: { gte: grade },
        isActive: true,
        subject: params.subject,
        difficulty: params.difficulty,
        id: { notIn: params.excludeIds || [] }
      },
      include: {
        choices: {
          orderBy: { order: 'asc' }
        }
      }
    });
  }
  
  private selectRandomQuestions(questions: Question[], count: number): Question[] {
    // Implement weighted random selection based on usage analytics
    const shuffled = questions.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }
}
```

**API Endpoints:**

1. **POST /api/questions/generate**
   - Request Body:
     ```json
     {
       "studentId": "student_123",
       "subject": "MATH",
       "difficulty": "MEDIUM",
       "count": 5,
       "excludeIds": ["q1", "q2"]
     }
     ```
   - Response:
     ```json
     {
       "success": true,
       "data": {
         "questions": [
           {
             "id": "q123",
             "stem": "What is 2 + 2?",
             "subject": "MATH",
             "difficulty": "EASY",
             "choices": [
               {
                 "id": "c1",
                 "text": "3",
                 "isCorrect": false,
                 "order": 1
               },
               {
                 "id": "c2",
                 "text": "4",
                 "isCorrect": true,
                 "order": 2
               }
             ]
           }
         ],
         "metadata": {
           "localeScope": "STATE:US-NY",
           "fallbackUsed": false,
           "totalAvailable": 150
         }
       }
     }
     ```

#### Story 2.2: Question Bank Management
**Implementation Details:**

**Admin Authentication:**
```typescript
// Middleware for admin routes
export async function adminAuthMiddleware(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!);
    const admin = await prisma.admin.findUnique({
      where: { id: payload.sub }
    });
    
    if (!admin || !admin.isActive) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    // Add admin info to request context
    request.headers.set('x-admin-id', admin.id);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
```

**API Endpoints:**

1. **POST /api/admin/questions**
   - Headers: `Authorization: Bearer <admin_token>`
   - Request Body:
     ```json
     {
       "stem": "Solve for x: 2x + 5 = 13",
       "subject": "MATH",
       "gradeMin": 8,
       "gradeMax": 10,
       "localeScope": "GLOBAL",
       "difficulty": "MEDIUM",
       "tags": ["algebra", "equations"],
       "choices": [
         {
           "text": "x = 3",
           "isCorrect": false,
           "explanation": "This would be correct if the equation was 2x + 3 = 9"
         },
         {
           "text": "x = 4",
           "isCorrect": true,
           "explanation": "Correct! 2(4) + 5 = 8 + 5 = 13"
         },
         {
           "text": "x = 5",
           "isCorrect": false,
           "explanation": "This gives us 2(5) + 5 = 15, which is too high"
         },
         {
           "text": "x = 6",
           "isCorrect": false,
           "explanation": "This gives us 2(6) + 5 = 17, which is too high"
         }
       ]
     }
     ```

2. **GET /api/admin/questions**
   - Query Parameters:
     - `page=1&limit=20`
     - `subject=MATH`
     - `difficulty=MEDIUM`
     - `localeScope=GLOBAL`
     - `search=algebra`
   - Response:
     ```json
     {
       "success": true,
       "data": {
         "questions": [...],
         "pagination": {
           "page": 1,
           "limit": 20,
           "total": 150,
           "totalPages": 8
         },
         "filters": {
           "subjects": ["MATH", "SCIENCE", "ENGLISH"],
           "difficulties": ["EASY", "MEDIUM", "HARD"],
           "localeScopes": ["GLOBAL", "COUNTRY:US", "STATE:US-NY"]
         }
       }
     }
     ```

3. **PUT /api/admin/questions/:id**
   - Update existing question
   - Maintains version history for audit trail

4. **DELETE /api/admin/questions/:id**
   - Soft delete (sets isActive: false)
   - Prevents deletion if question is used in active assignments

5. **POST /api/admin/questions/bulk-import**
   - CSV/JSON import functionality
   - Validation and error reporting
   - Preview mode before actual import

**Frontend Admin Interface:**

1. **QuestionManager.tsx**
   - Data table with sorting, filtering, pagination
   - Inline editing capabilities
   - Bulk operations (delete, export, tag management)

2. **QuestionEditor.tsx**
   - Rich text editor for question stem
   - Dynamic choice management
   - Real-time preview
   - Validation feedback

3. **QuestionImport.tsx**
   - File upload with drag-and-drop
   - CSV template download
   - Import preview and validation
   - Progress tracking for large imports

### Advanced Features

#### Question Analytics Dashboard
- Usage statistics per question
- Performance metrics (correct rate, time spent)
- Difficulty calibration based on student performance
- Content gap analysis by locale/grade

#### Content Recommendation Engine
- AI-powered question similarity detection
- Automatic tagging suggestions
- Content quality scoring
- Duplicate detection

#### Localization Management
- Locale-specific content workflows
- Translation management system
- Cultural appropriateness review
- Regional curriculum alignment

### Technical Implementation

#### Caching Strategy
```typescript
// Redis caching for frequently accessed questions
class QuestionCacheService {
  private redis = new Redis(process.env.REDIS_URL);
  
  async getCachedQuestions(key: string): Promise<Question[] | null> {
    const cached = await this.redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }
  
  async cacheQuestions(key: string, questions: Question[], ttl = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(questions));
  }
  
  generateCacheKey(params: QuestionGenerationParams): string {
    return `questions:${params.studentGrade}:${params.country}:${params.state}:${params.subject}:${params.difficulty}`;
  }
}
```

#### Database Optimization
- Composite indexes for common query patterns
- Materialized views for analytics
- Connection pooling for high concurrency
- Read replicas for question serving

#### API Rate Limiting
```typescript
// Rate limiting for question generation
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many question requests, please try again later'
});
```

### Testing Strategy

#### Unit Tests
- Question generation algorithm
- Locale hierarchy building
- Random selection logic
- Validation schemas

#### Integration Tests
- Database operations with test data
- Cache integration
- Admin authentication flow
- Bulk import functionality

#### Performance Tests
- Question generation under load
- Database query performance
- Cache hit/miss ratios
- Concurrent admin operations

### Security Considerations

#### Data Protection
- Encrypt sensitive question content
- Audit trail for all admin actions
- Role-based access control
- Input sanitization for all content

#### Content Security
- Plagiarism detection for imported questions
- Copyright compliance checking
- Content moderation workflows
- Version control for question changes

### Deployment Checklist

#### Database
- [ ] Run migrations for new tables
- [ ] Set up indexes for performance
- [ ] Configure read replicas if needed
- [ ] Set up backup strategy

#### Caching
- [ ] Redis instance configuration
- [ ] Cache warming strategies
- [ ] Monitoring and alerting
- [ ] Failover mechanisms

#### Admin Interface
- [ ] Admin user creation
- [ ] Permission system setup
- [ ] Audit logging configuration
- [ ] Content moderation tools

### Success Metrics
- Question generation response time < 100ms
- Admin interface load time < 2 seconds
- Question bank growth rate > 100 questions/week
- Content quality score > 4.5/5
- Zero data breaches or unauthorized access

### Dependencies
- Redis for caching
- JWT for admin authentication
- Rich text editor (e.g., TinyMCE)
- CSV parsing library
- Image upload service (for question diagrams)

### Timeline
- **Week 1:** Database schema and question generation service
- **Week 2:** Admin authentication and basic CRUD operations
- **Week 3:** Advanced admin interface and bulk operations
- **Week 4:** Analytics, caching, and performance optimization

This comprehensive implementation plan ensures a robust question management system that can scale with the application's growth while maintaining high performance and security standards.