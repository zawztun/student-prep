import { PrismaClient } from '@prisma/client'

// Define enums locally since they're not exported from @prisma/client until after generation
enum Subject {
  MATH = 'MATH',
  SCIENCE = 'SCIENCE',
  ENGLISH = 'ENGLISH',
  HISTORY = 'HISTORY',
  GEOGRAPHY = 'GEOGRAPHY',
  PHYSICS = 'PHYSICS',
  CHEMISTRY = 'CHEMISTRY',
  BIOLOGY = 'BIOLOGY'
}

enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD'
}

enum AssignmentStatus {
  SCHEDULED = 'SCHEDULED',
  DELIVERED = 'DELIVERED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE'
}

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data
  await prisma.assignmentSubmission.deleteMany()
  await prisma.assignmentQuestion.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.weeklyReport.deleteMany()
  await prisma.questionAnalytics.deleteMany()
  await prisma.questionChoice.deleteMany()
  await prisma.question.deleteMany()
  await prisma.studyPlan.deleteMany()
  await prisma.student.deleteMany()

  console.log('🧹 Cleaned existing data')

  // Create sample students
  const students = await Promise.all([
    prisma.student.create({
      data: {
        name: 'Alice Johnson',
        email: 'alice@example.com',
        grade: 10,
        country: 'US',
        state: 'CA',
        emailPreference: true,
      },
    }),
    prisma.student.create({
      data: {
        name: 'Bob Smith',
        email: 'bob@example.com',
        grade: 9,
        country: 'US',
        state: 'NY',
        emailPreference: false,
      },
    }),
    prisma.student.create({
      data: {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        grade: 11,
        country: 'CA',
        emailPreference: true,
      },
    }),
    prisma.student.create({
      data: {
        name: 'Diana Prince',
        email: 'diana@example.com',
        grade: 12,
        country: 'UK',
        emailPreference: true,
      },
    }),
  ])

  console.log('👥 Created sample students')

  // Create study plans for students
  await Promise.all(
    students.map((student) =>
      prisma.studyPlan.create({
        data: {
          studentId: student.id,
          schedule: ['Monday', 'Wednesday', 'Friday'],
          channels: student.emailPreference ? ['Email', 'In-App'] : ['In-App'],
        },
      })
    )
  )

  console.log('📅 Created study plans')

  // Create sample questions
  const mathQuestions = await Promise.all([
    prisma.question.create({
      data: {
        text: 'What is the value of x in the equation 2x + 5 = 13?',
        subject: Subject.MATH,
        gradeMin: 8,
        gradeMax: 10,
        difficulty: Difficulty.MEDIUM,
        localeScope: 'Global',
        explanation: 'To solve 2x + 5 = 13, subtract 5 from both sides to get 2x = 8, then divide by 2 to get x = 4.',
        choices: {
          create: [
            { text: '3', isCorrect: false, order: 1 },
            { text: '4', isCorrect: true, order: 2 },
            { text: '5', isCorrect: false, order: 3 },
            { text: '6', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        text: 'What is the area of a circle with radius 5 units?',
        subject: Subject.MATH,
        gradeMin: 9,
        gradeMax: 12,
        difficulty: Difficulty.MEDIUM,
        localeScope: 'Global',
        explanation: 'The area of a circle is π × r². With r = 5, the area is π × 5² = 25π square units.',
        choices: {
          create: [
            { text: '10π', isCorrect: false, order: 1 },
            { text: '25π', isCorrect: true, order: 2 },
            { text: '50π', isCorrect: false, order: 3 },
            { text: '100π', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
  ])

  const scienceQuestions = await Promise.all([
    prisma.question.create({
      data: {
        text: 'What is the chemical symbol for gold?',
        subject: Subject.SCIENCE,
        gradeMin: 7,
        gradeMax: 12,
        difficulty: Difficulty.EASY,
        localeScope: 'Global',
        explanation: 'Gold has the chemical symbol Au, derived from the Latin word "aurum".',
        choices: {
          create: [
            { text: 'Go', isCorrect: false, order: 1 },
            { text: 'Gd', isCorrect: false, order: 2 },
            { text: 'Au', isCorrect: true, order: 3 },
            { text: 'Ag', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        text: 'Which planet is known as the Red Planet?',
        subject: Subject.SCIENCE,
        gradeMin: 6,
        gradeMax: 10,
        difficulty: Difficulty.EASY,
        localeScope: 'Global',
        explanation: 'Mars is known as the Red Planet due to iron oxide (rust) on its surface.',
        choices: {
          create: [
            { text: 'Venus', isCorrect: false, order: 1 },
            { text: 'Mars', isCorrect: true, order: 2 },
            { text: 'Jupiter', isCorrect: false, order: 3 },
            { text: 'Saturn', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
  ])

  const englishQuestions = await Promise.all([
    prisma.question.create({
      data: {
        text: 'Which of the following is a synonym for "happy"?',
        subject: Subject.ENGLISH,
        gradeMin: 5,
        gradeMax: 8,
        difficulty: Difficulty.EASY,
        localeScope: 'Global',
        explanation: 'Joyful is a synonym for happy, both expressing a feeling of pleasure or contentment.',
        choices: {
          create: [
            { text: 'Sad', isCorrect: false, order: 1 },
            { text: 'Angry', isCorrect: false, order: 2 },
            { text: 'Joyful', isCorrect: true, order: 3 },
            { text: 'Tired', isCorrect: false, order: 4 },
          ],
        },
      },
    }),
  ])

  const allQuestions = [...mathQuestions, ...scienceQuestions, ...englishQuestions]

  console.log('❓ Created sample questions')

  // Create question analytics
  await Promise.all(
    allQuestions.map((question) =>
      prisma.questionAnalytics.create({
        data: {
          questionId: question.id,
          totalAttempts: Math.floor(Math.random() * 100) + 10,
          correctAttempts: Math.floor(Math.random() * 50) + 5,
          averageTimeSpent: Math.floor(Math.random() * 120) + 30,
          lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      })
    )
  )

  console.log('📊 Created question analytics')

  // Create sample assignments
  const assignments = await Promise.all(
    students.slice(0, 2).map((student, index) =>
      prisma.assignment.create({
        data: {
          studentId: student.id,
          title: `Week ${index + 1} Math Assignment`,
          description: `Practice problems for week ${index + 1} covering algebra and geometry.`,
          scheduledFor: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000), // Tomorrow, day after tomorrow
          status: index === 0 ? AssignmentStatus.DELIVERED : AssignmentStatus.SCHEDULED,
        },
      })
    )
  )

  console.log('📝 Created sample assignments')

  // Create assignment questions
  await Promise.all(
    assignments.map((assignment, assignmentIndex) =>
      Promise.all(
        mathQuestions.slice(0, 2).map((question, questionIndex) =>
          prisma.assignmentQuestion.create({
            data: {
              assignmentId: assignment.id,
              questionId: question.id,
              order: questionIndex + 1,
            },
          })
        )
      )
    )
  )

  console.log('🔗 Created assignment questions')

  // Create sample submissions for the first assignment
  const firstAssignment = assignments[0]
  const firstStudent = students[0]
  const assignmentQuestions = await prisma.assignmentQuestion.findMany({
    where: { assignmentId: firstAssignment.id },
    include: { question: { include: { choices: true } } },
  })

  await Promise.all(
    assignmentQuestions.map((aq: any) => {
      const correctChoice = aq.question.choices.find((c: any) => c.isCorrect)
      const randomChoice = aq.question.choices[Math.floor(Math.random() * aq.question.choices.length)]
      const selectedChoice = Math.random() > 0.3 ? correctChoice : randomChoice // 70% chance of correct answer

      return prisma.assignmentSubmission.create({
        data: {
          assignmentId: firstAssignment.id,
          questionId: aq.questionId,
          selectedChoiceId: selectedChoice!.id,
          isCorrect: selectedChoice!.isCorrect,
          timeSpent: Math.floor(Math.random() * 180) + 30, // 30-210 seconds
        },
      })
    })
  )

  console.log('✅ Created sample submissions')

  // Create sample weekly reports
  await Promise.all(
    students.slice(0, 2).map((student) => {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Start of current week
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6) // End of current week

      return prisma.weeklyReport.create({
        data: {
          studentId: student.id,
          weekStartDate: weekStart,
          weekEndDate: weekEnd,
          totalAssignments: 3,
          completedAssignments: 2,
          averageScore: Math.floor(Math.random() * 40) + 60, // 60-100%
          totalTimeSpent: Math.floor(Math.random() * 300) + 120, // 120-420 minutes
          strongSubjects: [Subject.MATH, Subject.SCIENCE],
          weakSubjects: [Subject.ENGLISH],
          recommendations: [
            'Focus more on English vocabulary',
            'Practice algebra problems daily',
            'Review science concepts regularly',
          ],
        },
      })
    })
  )

  console.log('📈 Created sample weekly reports')

  // Update assignment status to completed for first assignment
  await prisma.assignment.update({
    where: { id: firstAssignment.id },
    data: { status: AssignmentStatus.COMPLETED },
  })

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- ${students.length} students created`)
  console.log(`- ${students.length} study plans created`)
  console.log(`- ${allQuestions.length} questions created`)
  console.log(`- ${allQuestions.length} question analytics created`)
  console.log(`- ${assignments.length} assignments created`)
  console.log(`- Sample submissions and weekly reports created`)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:')
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })