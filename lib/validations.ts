import { z } from 'zod'

// Student Registration Schema
export const studentRegistrationSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .email('Please enter a valid email address')
    .toLowerCase(),
  grade: z
    .number()
    .int('Grade must be a whole number')
    .min(1, 'Grade must be between 1 and 12')
    .max(12, 'Grade must be between 1 and 12'),
  country: z
    .string()
    .min(2, 'Please select a country')
    .max(2, 'Invalid country code'),
  state: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, 'Please select a state'),
  emailPreference: z.boolean().default(true),
})

// Email Preference Schema
export const emailPreferenceSchema = z.object({
  emailPreference: z.boolean(),
})

// Question Generation Schema
export const questionGenerationSchema = z.object({
  grade: z
    .number()
    .int('Grade must be a whole number')
    .min(1, 'Grade must be between 1 and 12')
    .max(12, 'Grade must be between 1 and 12'),
  subject: z.enum(['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'], {
    errorMap: () => ({ message: 'Please select a valid subject' }),
  }),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  count: z
    .number()
    .int('Count must be a whole number')
    .min(1, 'Must generate at least 1 question')
    .max(50, 'Cannot generate more than 50 questions at once')
    .default(10),
  locale: z.string().optional(),
})

// Question Creation Schema
export const questionSchema = z.object({
  text: z
    .string()
    .min(10, 'Question text must be at least 10 characters')
    .max(1000, 'Question text must be less than 1000 characters'),
  subject: z.enum(['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY'], {
    errorMap: () => ({ message: 'Please select a valid subject' }),
  }),
  gradeMin: z
    .number()
    .int('Minimum grade must be a whole number')
    .min(1, 'Minimum grade must be between 1 and 12')
    .max(12, 'Minimum grade must be between 1 and 12'),
  gradeMax: z
    .number()
    .int('Maximum grade must be a whole number')
    .min(1, 'Maximum grade must be between 1 and 12')
    .max(12, 'Maximum grade must be between 1 and 12'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    errorMap: () => ({ message: 'Please select a valid difficulty' }),
  }),
  localeScope: z
    .string()
    .min(2, 'Locale scope is required')
    .max(10, 'Invalid locale scope'),
  explanation: z
    .string()
    .min(10, 'Explanation must be at least 10 characters')
    .max(2000, 'Explanation must be less than 2000 characters'),
  choices: z
    .array(
      z.object({
        text: z
          .string()
          .min(1, 'Choice text is required')
          .max(500, 'Choice text must be less than 500 characters'),
        isCorrect: z.boolean(),
      })
    )
    .min(2, 'At least 2 choices are required')
    .max(6, 'Maximum 6 choices allowed')
    .refine(
      (choices) => choices.filter((choice) => choice.isCorrect).length === 1,
      'Exactly one choice must be marked as correct'
    ),
})

// Refine the question schema to ensure gradeMax >= gradeMin
export const questionSchemaWithGradeValidation = questionSchema.refine(
  (data) => data.gradeMax >= data.gradeMin,
  {
    message: 'Maximum grade must be greater than or equal to minimum grade',
    path: ['gradeMax'],
  }
)

// Question Filter Schema
export const questionFilterSchema = z.object({
  subject: z.enum(['MATH', 'SCIENCE', 'ENGLISH', 'HISTORY', 'GEOGRAPHY', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY']).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  gradeMin: z.number().int().min(1).max(12).optional(),
  gradeMax: z.number().int().min(1).max(12).optional(),
  localeScope: z.string().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Assignment Creation Schema
export const assignmentSchema = z.object({
  studentId: z.string().cuid('Invalid student ID'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  scheduledFor: z.date().min(new Date(), 'Scheduled date must be in the future'),
  questionIds: z
    .array(z.string().cuid('Invalid question ID'))
    .min(1, 'At least one question is required')
    .max(20, 'Maximum 20 questions allowed per assignment'),
})

// Assignment Submission Schema
export const assignmentSubmissionSchema = z.object({
  assignmentId: z.string().cuid('Invalid assignment ID'),
  questionId: z.string().cuid('Invalid question ID'),
  selectedChoiceId: z.string().cuid('Invalid choice ID'),
  timeSpent: z.number().int().min(0, 'Time spent cannot be negative'),
})

// Weekly Report Filter Schema
export const weeklyReportFilterSchema = z.object({
  studentId: z.string().cuid('Invalid student ID').optional(),
  weekStartDate: z.date().optional(),
  weekEndDate: z.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Email Validation Schema (for API endpoint)
export const emailValidationSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
})

// Study Plan Update Schema
export const studyPlanUpdateSchema = z.object({
  schedule: z
    .array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']))
    .min(1, 'At least one day must be selected')
    .max(7, 'Cannot select more than 7 days'),
  channels: z
    .array(z.enum(['Email', 'In-App']))
    .min(1, 'At least one delivery channel must be selected')
    .max(2, 'Maximum 2 delivery channels allowed'),
})

// Bulk Operations Schema
export const bulkDeleteSchema = z.object({
  ids: z
    .array(z.string().cuid('Invalid ID'))
    .min(1, 'At least one item must be selected')
    .max(100, 'Cannot delete more than 100 items at once'),
})

export const bulkUpdateSchema = z.object({
  ids: z
    .array(z.string().cuid('Invalid ID'))
    .min(1, 'At least one item must be selected')
    .max(100, 'Cannot update more than 100 items at once'),
  updates: z.record(z.any()).refine(
    (updates) => Object.keys(updates).length > 0,
    'At least one field must be updated'
  ),
})

// CSV Import Schema
export const csvImportSchema = z.object({
  file: z.instanceof(File, { message: 'Please select a valid CSV file' }),
  validateOnly: z.boolean().default(false),
})

// Search Schema
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(100, 'Search query must be less than 100 characters'),
  type: z.enum(['questions', 'students', 'assignments']).optional(),
  filters: z.record(z.any()).optional(),
})

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Type exports for use in components
export type StudentRegistrationInput = z.infer<typeof studentRegistrationSchema>
export type EmailPreferenceInput = z.infer<typeof emailPreferenceSchema>
export type QuestionGenerationInput = z.infer<typeof questionGenerationSchema>
export type QuestionInput = z.infer<typeof questionSchemaWithGradeValidation>
export type QuestionFilterInput = z.infer<typeof questionFilterSchema>
export type AssignmentInput = z.infer<typeof assignmentSchema>
export type AssignmentSubmissionInput = z.infer<typeof assignmentSubmissionSchema>
export type WeeklyReportFilterInput = z.infer<typeof weeklyReportFilterSchema>
export type EmailValidationInput = z.infer<typeof emailValidationSchema>
export type StudyPlanUpdateInput = z.infer<typeof studyPlanUpdateSchema>
export type BulkDeleteInput = z.infer<typeof bulkDeleteSchema>
export type BulkUpdateInput = z.infer<typeof bulkUpdateSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type PaginationInput = z.infer<typeof paginationSchema>