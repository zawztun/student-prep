'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Globe, 
  MapPin, 
  Bell, 
  BellOff,
  Calendar,
  Clock,
  BookOpen,
  TrendingUp,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  email: string;
  grade: number;
  country: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
  studyPlan: {
    id: string;
    schedule: string[];
    channels: string[];
    createdAt: string;
    updatedAt: string;
  } | null;
}

interface DashboardStats {
  totalAssignments: number;
  completedAssignments: number;
  averageScore: number;
  totalTimeSpent: number;
  subjectPerformance: Record<string, { score: number; count: number }>;
}

export default function StudentDashboard() {
  const params = useParams();
  const studentId = params.studentId as string;
  
  const [student, setStudent] = useState<Student | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emailPreference, setEmailPreference] = useState(false);
  const [updatingPreference, setUpdatingPreference] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student data
        const studentResponse = await fetch(`/api/students/${studentId}`);
        if (!studentResponse.ok) {
          throw new Error('Failed to fetch student data');
        }
        const studentData = await studentResponse.json();
        setStudent(studentData.data);
        
        // Fetch analytics data
        const statsResponse = await fetch(`/api/analytics/students/${studentId}`);
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(statsData.data);
        }
        
      } catch (err) {
        console.error('Dashboard error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchData();
    }
  }, [studentId]);

  const handleEmailPreferenceChange = async (newPreference: boolean) => {
    setUpdatingPreference(true);
    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailPreference: newPreference }),
      });

      if (!response.ok) {
        throw new Error('Failed to update email preference');
      }

      setEmailPreference(newPreference);
    } catch (err) {
      console.error('Update preference error:', err);
      // Revert the change
      setEmailPreference(!newPreference);
    } finally {
      setUpdatingPreference(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Student not found'}
          </h1>
          <p className="text-gray-600">
            Please check the URL or try again later.
          </p>
        </div>
      </div>
    );
  }

  const completionRate = stats ? 
    (stats.totalAssignments > 0 ? (stats.completedAssignments / stats.totalAssignments) * 100 : 0) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {student.name}!
              </h1>
              <p className="text-gray-600 mt-1">
                Track your progress and manage your learning journey
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Assignments</h3>
                    <p className="text-sm text-gray-600">Total completed</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats?.completedAssignments || 0}
                  </span>
                  <span className="text-sm text-gray-600">
                    / {stats?.totalAssignments || 0}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {completionRate.toFixed(1)}% completion rate
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Average Score</h3>
                    <p className="text-sm text-gray-600">Overall performance</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats?.averageScore ? `${stats.averageScore.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Study Time</h3>
                    <p className="text-sm text-gray-600">Total hours</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats?.totalTimeSpent ? Math.round(stats.totalTimeSpent / 3600) : 0}h
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">This Week</h3>
                    <p className="text-sm text-gray-600">Upcoming assignments</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-gray-900">0</span>
                </div>
              </div>
            </div>

            {/* Subject Performance */}
            {stats?.subjectPerformance && Object.keys(stats.subjectPerformance).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Subject Performance</h3>
                <div className="space-y-4">
                  {Object.entries(stats.subjectPerformance).map(([subject, data]) => (
                    <div key={subject} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {subject.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {subject.toLowerCase()}
                          </p>
                          <p className="text-sm text-gray-600">
                            {data.count} assignment{data.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {data.score.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Profile</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{student.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{student.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Grade {student.grade}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{student.country}</span>
                </div>
                {student.state && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{student.state}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Email Preferences */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Notifications</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {emailPreference ? (
                    <Bell className="w-4 h-4 text-blue-600" />
                  ) : (
                    <BellOff className="w-4 h-4 text-gray-400" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Email Notifications
                    </p>
                    <p className="text-xs text-gray-600">
                      Weekly reports & reminders
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleEmailPreferenceChange(!emailPreference)}
                  disabled={updatingPreference}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    emailPreference ? "bg-blue-600" : "bg-gray-200",
                    updatingPreference && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      emailPreference ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            {/* Study Plan */}
            {student.studyPlan && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Study Plan</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Schedule</p>
                    <div className="flex flex-wrap gap-2">
                      {student.studyPlan.schedule.map((day, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Channels</p>
                    <div className="flex flex-wrap gap-2">
                      {student.studyPlan.channels.map((channel, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}