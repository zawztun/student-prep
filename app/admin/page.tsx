'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'

interface Question {
  id: string
  stem: string
  subject: string
  difficulty: string
  localeScope: string
  countryCode?: string
  regionCode?: string
  tags: string[]
  isActive: boolean
  choices: {
    id: string
    text: string
    isCorrect: boolean
    explanation?: string
    order: number
  }[]
  analytics?: {
    timesUsed: number
    correctRate: number
  }
}

export default function AdminDashboard() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSubject, setFilterSubject] = useState('all')
  const [filterDifficulty, setFilterDifficulty] = useState('all')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const savedToken = localStorage.getItem('adminToken')
    if (savedToken) {
      setToken(savedToken)
      setIsAuthenticated(true)
      fetchQuestions(savedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('adminToken', data.token)
        setToken(data.token)
        setIsAuthenticated(true)
        fetchQuestions(data.token)
      } else {
        alert('Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Login error')
    }
  }

  const fetchQuestions = async (authToken: string) => {
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '50'
      })
      
      if (filterSubject !== 'all') params.append('subject', filterSubject)
      if (filterDifficulty !== 'all') params.append('difficulty', filterDifficulty)
      if (searchTerm) params.append('search', searchTerm)
      
      const response = await fetch(`/api/admin/questions?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions)
      }
    } catch (error) {
      console.error('Fetch questions error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (token) {
      setLoading(true)
      fetchQuestions(token)
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (!token || !confirm('Are you sure you want to delete this question?')) return
    
    try {
      const response = await fetch(`/api/admin/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionId))
      }
    } catch (error) {
      console.error('Delete question error:', error)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Sign in to access the admin dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({...loginForm, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage questions and view analytics</p>
        </div>

        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="questions">Questions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            {/* Search and Filters */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                      onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Select value={filterSubject} onValueChange={setFilterSubject}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Subjects</SelectItem>
                      <SelectItem value="MATH">Math</SelectItem>
                      <SelectItem value="SCIENCE">Science</SelectItem>
                      <SelectItem value="ENGLISH">English</SelectItem>
                      <SelectItem value="HISTORY">History</SelectItem>
                      <SelectItem value="GEOGRAPHY">Geography</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value="EASY">Easy</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HARD">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="grid gap-4">
              {questions.map((question) => (
                <Card key={question.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{question.stem}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge variant="secondary">{question.subject}</Badge>
                          <Badge variant="outline">{question.difficulty}</Badge>
                          <Badge variant="outline">{question.localeScope}</Badge>
                          {question.countryCode && (
                            <Badge variant="outline">{question.countryCode}</Badge>
                          )}
                          {!question.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-3">
                          {question.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Choices */}
                    <div className="space-y-2">
                      {question.choices.map((choice, index) => (
                        <div 
                          key={choice.id} 
                          className={`p-3 rounded border ${
                            choice.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                            <span>{choice.text}</span>
                            {choice.isCorrect && (
                              <Badge variant="default" className="ml-auto">Correct</Badge>
                            )}
                          </div>
                          {choice.explanation && (
                            <p className="text-sm text-gray-600 mt-1 ml-6">{choice.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Analytics */}
                    {question.analytics && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>Used: {question.analytics.timesUsed} times</span>
                          <span>Correct Rate: {(question.analytics.correctRate * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {questions.length === 0 && (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-gray-500">No questions found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Question Analytics</CardTitle>
                <CardDescription>Overview of question usage and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}