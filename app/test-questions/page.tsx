'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react'

interface Question {
  id: string
  stem: string
  subject: string
  difficulty: string
  localeScope: string
  countryCode?: string
  regionCode?: string
  tags: string[]
  choices: {
    id: string
    text: string
    isCorrect: boolean
    explanation?: string
    order: number
  }[]
}

interface Answer {
  questionId: string
  choiceId: string
  isCorrect: boolean
}

export default function TestQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState<Answer[]>([])
  const [score, setScore] = useState(0)
  
  // Form state
  const [subject, setSubject] = useState('MATH')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [count, setCount] = useState('5')
  const [studentCountry, setStudentCountry] = useState('')
  const [studentRegion, setStudentRegion] = useState('')

  const generateQuestions = async () => {
    setLoading(true)
    setSubmitted(false)
    setAnswers({})
    setResults([])
    
    try {
      const requestBody: any = {
        subject,
        difficulty,
        count: parseInt(count)
      }
      
      if (studentCountry) requestBody.studentCountry = studentCountry
      if (studentRegion) requestBody.studentRegion = studentRegion
      
      const response = await fetch('/api/questions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })
      
      if (response.ok) {
        const data = await response.json()
        // Display only 2 questions even if more are requested
        const displayQuestions = data.questions.slice(0, 2)
        setQuestions(displayQuestions)
        if (data.questions.length === 0) {
          alert('No questions found for the selected criteria. Try different subject/difficulty.')
        }
      } else {
        const errorData = await response.json()
        console.error('Generate questions error:', errorData)
        alert(`Failed to generate questions: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Generate questions error:', error)
      alert('Error generating questions')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: string, choiceId: string) => {
    if (submitted) return
    setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
  }

  const submitAnswers = async () => {
    if (Object.keys(answers).length !== questions.length) {
      alert('Please answer all questions before submitting')
      return
    }

    const answerResults: Answer[] = []
    let correctCount = 0

    questions.forEach(question => {
      const selectedChoiceId = answers[question.id]
      const selectedChoice = question.choices.find(c => c.id === selectedChoiceId)
      const isCorrect = selectedChoice?.isCorrect || false
      
      if (isCorrect) correctCount++
      
      answerResults.push({
        questionId: question.id,
        choiceId: selectedChoiceId,
        isCorrect
      })
    })

    setResults(answerResults)
    setScore(correctCount)
    setSubmitted(true)

    // Update analytics
    try {
      await fetch('/api/questions/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: answerResults.map(result => ({
            questionId: result.questionId,
            wasCorrect: result.isCorrect
          }))
        })
      })
    } catch (error) {
      console.error('Analytics update error:', error)
    }
  }

  const resetTest = () => {
    setQuestions([])
    setAnswers({})
    setSubmitted(false)
    setResults([])
    setScore(0)
  }

  const getChoiceStatus = (questionId: string, choiceId: string) => {
    if (!submitted) return 'default'
    
    const selectedChoiceId = answers[questionId]
    const question = questions.find(q => q.id === questionId)
    const choice = question?.choices.find(c => c.id === choiceId)
    
    if (choice?.isCorrect) return 'correct'
    if (selectedChoiceId === choiceId && !choice?.isCorrect) return 'incorrect'
    return 'default'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Question Generation Test</h1>
          <p className="text-gray-600 mt-2">Test the localized question generation system</p>
        </div>

        {/* Generation Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Questions</CardTitle>
            <CardDescription>Configure and generate questions for testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MATH">Math</SelectItem>
                    <SelectItem value="SCIENCE">Science</SelectItem>
                    <SelectItem value="ENGLISH">English</SelectItem>
                    <SelectItem value="HISTORY">History</SelectItem>
                    <SelectItem value="GEOGRAPHY">Geography</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="count">Number of Questions</Label>
                <Select value={count} onValueChange={setCount}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="15">15</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentCountry">Student Country (Optional)</Label>
                <Input
                  id="studentCountry"
                  placeholder="e.g., US, UK, AU"
                  value={studentCountry}
                  onChange={(e) => setStudentCountry(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="studentRegion">Student Region (Optional)</Label>
                <Input
                  id="studentRegion"
                  placeholder="e.g., California, London"
                  value={studentRegion}
                  onChange={(e) => setStudentRegion(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  console.log('Generate Questions button clicked!')
                  generateQuestions()
                }} 
                disabled={loading}
                className="w-full"
                type="button"
              >
                {loading ? 'Generating...' : 'Generate Questions'}
              </Button>
              {questions.length > 0 && (
                <Button variant="outline" onClick={resetTest}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {submitted && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                  Score: {score}/{questions.length} ({Math.round((score / questions.length) * 100)}%)
                </h2>
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    {score} Correct
                  </span>
                  <span className="flex items-center gap-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    {questions.length - score} Incorrect
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions */}
        {questions.length > 0 && (
          <div className="space-y-6">
            {questions.map((question, questionIndex) => (
              <Card key={question.id}>
                <CardContent className="pt-6">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold">Question {questionIndex + 1}</span>
                      <Badge variant="secondary">{question.subject}</Badge>
                      <Badge variant="outline">{question.difficulty}</Badge>
                      <Badge variant="outline">{question.localeScope}</Badge>
                      {question.countryCode && (
                        <Badge variant="outline">{question.countryCode}</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-medium mb-3">{question.stem}</h3>
                    
                    {question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {question.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {question.choices
                      .sort((a, b) => a.order - b.order)
                      .map((choice, choiceIndex) => {
                        const status = getChoiceStatus(question.id, choice.id)
                        const isSelected = answers[question.id] === choice.id
                        
                        return (
                          <div
                            key={choice.id}
                            className={`p-3 rounded border cursor-pointer transition-colors ${
                              status === 'correct'
                                ? 'bg-green-50 border-green-200'
                                : status === 'incorrect'
                                ? 'bg-red-50 border-red-200'
                                : isSelected
                                ? 'bg-blue-50 border-blue-200'
                                : 'bg-white border-gray-200 hover:bg-gray-50'
                            }`}
                            onClick={() => handleAnswerSelect(question.id, choice.id)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {String.fromCharCode(65 + choiceIndex)}.
                              </span>
                              <span className="flex-1">{choice.text}</span>
                              {status === 'correct' && (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              )}
                              {status === 'incorrect' && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                            {submitted && choice.explanation && (
                              <p className="text-sm text-gray-600 mt-2 ml-6">
                                {choice.explanation}
                              </p>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {!submitted && questions.length > 0 && (
              <div className="text-center">
                <Button onClick={submitAnswers} size="lg">
                  Submit Answers
                </Button>
              </div>
            )}
          </div>
        )}
        
        {questions.length === 0 && !loading && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-500">Generate questions to start testing</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}