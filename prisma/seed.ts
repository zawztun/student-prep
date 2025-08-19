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
    // MATH EASY questions
    prisma.question.create({
      data: {
        stem: 'What is 7 + 8?',
        subject: Subject.MATH,
        gradeMin: 5,
        gradeMax: 7,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['arithmetic', 'addition', 'basic'],
        choices: {
          create: [
            { text: '14', isCorrect: false, order: 1, explanation: 'This would be 7 × 2, not 7 + 8' },
            { text: '15', isCorrect: true, order: 2, explanation: 'Correct! 7 + 8 = 15' },
            { text: '16', isCorrect: false, order: 3, explanation: 'This is one more than the correct answer' },
            { text: '17', isCorrect: false, order: 4, explanation: 'This is two more than the correct answer' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What is 12 - 5?',
        subject: Subject.MATH,
        gradeMin: 5,
        gradeMax: 7,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['arithmetic', 'subtraction', 'basic'],
        choices: {
          create: [
            { text: '6', isCorrect: false, order: 1, explanation: 'This is one less than the correct answer' },
            { text: '7', isCorrect: true, order: 2, explanation: 'Correct! 12 - 5 = 7' },
            { text: '8', isCorrect: false, order: 3, explanation: 'This is one more than the correct answer' },
            { text: '17', isCorrect: false, order: 4, explanation: 'This would be 12 + 5, not 12 - 5' },
          ],
        },
      },
    }),
    // MATH MEDIUM questions
    prisma.question.create({
      data: {
        stem: 'What is the value of x in the equation 2x + 5 = 13?',
        subject: Subject.MATH,
        gradeMin: 8,
        gradeMax: 10,
        difficulty: Difficulty.MEDIUM,
        localeScope: 'GLOBAL',
        tags: ['algebra', 'equations', 'solving'],
        choices: {
          create: [
            { text: '3', isCorrect: false, order: 1, explanation: 'This would be correct if the equation was 2x + 3 = 9' },
            { text: '4', isCorrect: true, order: 2, explanation: 'Correct! 2(4) + 5 = 8 + 5 = 13' },
            { text: '5', isCorrect: false, order: 3, explanation: 'This gives us 2(5) + 5 = 15, which is too high' },
            { text: '6', isCorrect: false, order: 4, explanation: 'This gives us 2(6) + 5 = 17, which is too high' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What is the area of a circle with radius 5 units?',
        subject: Subject.MATH,
        gradeMin: 9,
        gradeMax: 12,
        difficulty: Difficulty.MEDIUM,
        localeScope: 'GLOBAL',
        tags: ['geometry', 'circles', 'area'],
        choices: {
          create: [
            { text: '10π', isCorrect: false, order: 1, explanation: 'This would be the circumference formula: 2πr = 2π(5) = 10π' },
            { text: '25π', isCorrect: true, order: 2, explanation: 'Correct! Area = πr² = π(5)² = 25π square units' },
            { text: '50π', isCorrect: false, order: 3, explanation: 'This is double the correct answer' },
            { text: '100π', isCorrect: false, order: 4, explanation: 'This would be if we used diameter instead of radius' },
          ],
        },
      },
    }),
    // MATH HARD questions
    prisma.question.create({
      data: {
        stem: 'If f(x) = 2x³ - 3x² + x - 5, what is f\'(2)?',
        subject: Subject.MATH,
        gradeMin: 11,
        gradeMax: 12,
        difficulty: Difficulty.HARD,
        localeScope: 'GLOBAL',
        tags: ['calculus', 'derivatives', 'polynomials'],
        choices: {
          create: [
            { text: '13', isCorrect: true, order: 1, explanation: 'Correct! f\'(x) = 6x² - 6x + 1, so f\'(2) = 6(4) - 6(2) + 1 = 24 - 12 + 1 = 13' },
            { text: '11', isCorrect: false, order: 2, explanation: 'This is the result if you forgot to add the constant term' },
            { text: '25', isCorrect: false, order: 3, explanation: 'This is the result if you calculated f(2) instead of f\'(2)' },
            { text: '7', isCorrect: false, order: 4, explanation: 'This is incorrect; check your derivative calculation' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What is the limit of (sin x)/x as x approaches 0?',
        subject: Subject.MATH,
        gradeMin: 11,
        gradeMax: 12,
        difficulty: Difficulty.HARD,
        localeScope: 'GLOBAL',
        tags: ['calculus', 'limits', 'trigonometry'],
        choices: {
          create: [
            { text: '0', isCorrect: false, order: 1, explanation: 'This would be true if sin x approached 0 faster than x' },
            { text: '1', isCorrect: true, order: 2, explanation: 'Correct! This is a fundamental limit in calculus' },
            { text: '∞', isCorrect: false, order: 3, explanation: 'The limit exists and is finite' },
            { text: 'Does not exist', isCorrect: false, order: 4, explanation: 'The limit does exist and equals 1' },
          ],
        },
      },
    }),
  ])

  const scienceQuestions = await Promise.all([
    // SCIENCE EASY questions
    prisma.question.create({
      data: {
        stem: 'What is the chemical symbol for gold?',
        subject: Subject.SCIENCE,
        gradeMin: 7,
        gradeMax: 12,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['chemistry', 'elements', 'symbols'],
        choices: {
          create: [
            { text: 'Go', isCorrect: false, order: 1, explanation: 'This is not a valid chemical symbol' },
            { text: 'Gd', isCorrect: false, order: 2, explanation: 'This is the symbol for Gadolinium' },
            { text: 'Au', isCorrect: true, order: 3, explanation: 'Correct! Au comes from the Latin word "aurum"' },
            { text: 'Ag', isCorrect: false, order: 4, explanation: 'This is the symbol for Silver (argentum)' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'Which planet is known as the Red Planet?',
        subject: Subject.SCIENCE,
        gradeMin: 6,
        gradeMax: 10,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['astronomy', 'planets', 'solar-system'],
        choices: {
          create: [
            { text: 'Venus', isCorrect: false, order: 1, explanation: 'Venus is known for its thick atmosphere and extreme heat' },
            { text: 'Mars', isCorrect: true, order: 2, explanation: 'Correct! Mars appears red due to iron oxide (rust) on its surface' },
            { text: 'Jupiter', isCorrect: false, order: 3, explanation: 'Jupiter is the largest planet and has a Great Red Spot' },
            { text: 'Saturn', isCorrect: false, order: 4, explanation: 'Saturn is known for its prominent ring system' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What gas do plants absorb from the atmosphere during photosynthesis?',
        subject: Subject.SCIENCE,
        gradeMin: 6,
        gradeMax: 10,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['biology', 'photosynthesis', 'plants'],
        choices: {
          create: [
            { text: 'Oxygen', isCorrect: false, order: 1, explanation: 'Plants release oxygen during photosynthesis' },
            { text: 'Carbon dioxide', isCorrect: true, order: 2, explanation: 'Correct! Plants absorb CO2 and convert it to glucose' },
            { text: 'Nitrogen', isCorrect: false, order: 3, explanation: 'Nitrogen is not directly used in photosynthesis' },
            { text: 'Hydrogen', isCorrect: false, order: 4, explanation: 'Hydrogen comes from water, not directly from the atmosphere' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What is the hardest natural substance on Earth?',
        subject: Subject.SCIENCE,
        gradeMin: 7,
        gradeMax: 12,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['geology', 'minerals', 'hardness'],
        choices: {
          create: [
            { text: 'Quartz', isCorrect: false, order: 1, explanation: 'Quartz is hard but not the hardest natural substance' },
            { text: 'Diamond', isCorrect: true, order: 2, explanation: 'Correct! Diamond has a hardness of 10 on the Mohs scale' },
            { text: 'Steel', isCorrect: false, order: 3, explanation: 'Steel is man-made, not a natural substance' },
            { text: 'Granite', isCorrect: false, order: 4, explanation: 'Granite is a rock composed of various minerals' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'How many bones are there in an adult human body?',
        subject: Subject.SCIENCE,
        gradeMin: 8,
        gradeMax: 12,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['biology', 'human-anatomy', 'bones'],
        choices: {
          create: [
            { text: '186', isCorrect: false, order: 1, explanation: 'This is too few bones for an adult human' },
            { text: '206', isCorrect: true, order: 2, explanation: 'Correct! An adult human has 206 bones' },
            { text: '226', isCorrect: false, order: 3, explanation: 'This is too many bones for an adult human' },
            { text: '246', isCorrect: false, order: 4, explanation: 'This is significantly more than the actual number' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What is the center of an atom called?',
        subject: Subject.SCIENCE,
        gradeMin: 7,
        gradeMax: 11,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['physics', 'atomic-structure', 'atoms'],
        choices: {
          create: [
            { text: 'Electron', isCorrect: false, order: 1, explanation: 'Electrons orbit around the center of the atom' },
            { text: 'Proton', isCorrect: false, order: 2, explanation: 'Protons are found in the center but the center itself has a name' },
            { text: 'Nucleus', isCorrect: true, order: 3, explanation: 'Correct! The nucleus is the center of an atom containing protons and neutrons' },
            { text: 'Neutron', isCorrect: false, order: 4, explanation: 'Neutrons are found in the center but the center itself has a name' },
          ],
        },
      },
    }),
  ])

  const englishQuestions = await Promise.all([
    // ENGLISH EASY questions
    prisma.question.create({
      data: {
        stem: 'Which of the following is a synonym for "happy"?',
        subject: Subject.ENGLISH,
        gradeMin: 5,
        gradeMax: 8,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['vocabulary', 'synonyms', 'emotions'],
        choices: {
          create: [
            { text: 'Sad', isCorrect: false, order: 1, explanation: 'Sad is an antonym (opposite) of happy' },
            { text: 'Angry', isCorrect: false, order: 2, explanation: 'Angry is a different emotion, not related to happiness' },
            { text: 'Joyful', isCorrect: true, order: 3, explanation: 'Correct! Joyful is a synonym for happy' },
            { text: 'Tired', isCorrect: false, order: 4, explanation: 'Tired describes a physical state, not an emotion like happy' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What is the plural form of "child"?',
        subject: Subject.ENGLISH,
        gradeMin: 5,
        gradeMax: 8,
        difficulty: Difficulty.EASY,
        localeScope: 'GLOBAL',
        tags: ['grammar', 'plurals', 'irregular'],
        choices: {
          create: [
            { text: 'Childs', isCorrect: false, order: 1, explanation: 'This follows regular plural rules but "child" is irregular' },
            { text: 'Children', isCorrect: true, order: 2, explanation: 'Correct! "Children" is the irregular plural of "child"' },
            { text: 'Childes', isCorrect: false, order: 3, explanation: 'This is not a valid English plural form' },
            { text: 'Child', isCorrect: false, order: 4, explanation: 'This is the singular form, not plural' },
          ],
        },
      },
    }),
    // ENGLISH MEDIUM questions
    prisma.question.create({
      data: {
        stem: 'Which sentence uses the correct form of "their," "there," or "they\'re"?',
        subject: Subject.ENGLISH,
        gradeMin: 8,
        gradeMax: 10,
        difficulty: Difficulty.MEDIUM,
        localeScope: 'GLOBAL',
        tags: ['grammar', 'homophones', 'usage'],
        choices: {
          create: [
            { text: 'Their going to the store.', isCorrect: false, order: 1, explanation: 'Should be "They\'re" (they are) going to the store' },
            { text: 'The books are over they\'re.', isCorrect: false, order: 2, explanation: 'Should be "there" (location) not "they\'re" (they are)' },
            { text: 'They\'re planning their vacation.', isCorrect: true, order: 3, explanation: 'Correct! "They\'re" = they are, "their" = possessive' },
            { text: 'There car is in the garage.', isCorrect: false, order: 4, explanation: 'Should be "Their" (possessive) car, not "there" (location)' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'What is the main theme of Shakespeare\'s "Romeo and Juliet"?',
        subject: Subject.ENGLISH,
        gradeMin: 9,
        gradeMax: 12,
        difficulty: Difficulty.MEDIUM,
        localeScope: 'GLOBAL',
        tags: ['literature', 'shakespeare', 'themes'],
        choices: {
          create: [
            { text: 'The importance of education', isCorrect: false, order: 1, explanation: 'Education is not a central theme in Romeo and Juliet' },
            { text: 'Love conquers all obstacles', isCorrect: true, order: 2, explanation: 'Correct! The tragic love story shows love\'s power despite family feuds' },
            { text: 'The dangers of technology', isCorrect: false, order: 3, explanation: 'Technology was not a concern in Shakespeare\'s time' },
            { text: 'The value of hard work', isCorrect: false, order: 4, explanation: 'Hard work is not a main theme in this tragedy' },
          ],
        },
      },
    }),
    // ENGLISH HARD questions
    prisma.question.create({
      data: {
        stem: 'Which literary device is used in the phrase "The wind whispered through the trees"?',
        subject: Subject.ENGLISH,
        gradeMin: 10,
        gradeMax: 12,
        difficulty: Difficulty.HARD,
        localeScope: 'GLOBAL',
        tags: ['literature', 'literary-devices', 'figurative-language'],
        choices: {
          create: [
            { text: 'Metaphor', isCorrect: false, order: 1, explanation: 'A metaphor directly compares two things without "like" or "as"' },
            { text: 'Personification', isCorrect: true, order: 2, explanation: 'Correct! Giving human qualities (whispering) to non-human things (wind)' },
            { text: 'Simile', isCorrect: false, order: 3, explanation: 'A simile uses "like" or "as" to compare things' },
            { text: 'Alliteration', isCorrect: false, order: 4, explanation: 'Alliteration is repetition of initial consonant sounds' },
          ],
        },
      },
    }),
    prisma.question.create({
      data: {
        stem: 'In which narrative perspective is the story told if the narrator uses "I" and knows only their own thoughts?',
        subject: Subject.ENGLISH,
        gradeMin: 10,
        gradeMax: 12,
        difficulty: Difficulty.HARD,
        localeScope: 'GLOBAL',
        tags: ['literature', 'narrative-perspective', 'point-of-view'],
        choices: {
          create: [
            { text: 'Third person omniscient', isCorrect: false, order: 1, explanation: 'Third person omniscient uses "he/she" and knows all characters\' thoughts' },
            { text: 'First person limited', isCorrect: true, order: 2, explanation: 'Correct! First person limited uses "I" and knows only the narrator\'s thoughts' },
            { text: 'Second person', isCorrect: false, order: 3, explanation: 'Second person uses "you" to address the reader directly' },
            { text: 'Third person limited', isCorrect: false, order: 4, explanation: 'Third person limited uses "he/she" and focuses on one character\'s perspective' },
          ],
        },
      },
    }),
  ])

  const allQuestions = [...mathQuestions, ...scienceQuestions, ...englishQuestions]

  console.log('❓ Created sample questions')

  // Create question analytics
  await Promise.all(
    allQuestions.map((question) => {
      const timesUsed = Math.floor(Math.random() * 100) + 10
      const correctAttempts = Math.floor(Math.random() * timesUsed) + 1
      return prisma.questionAnalytics.create({
        data: {
          questionId: question.id,
          timesUsed,
          correctRate: correctAttempts / timesUsed,
          avgTimeSpent: Math.floor(Math.random() * 120) + 30,
          lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      })
    })
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