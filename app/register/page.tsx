'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentRegistrationSchema, type StudentRegistrationInput } from '@/lib/validations';
import { cn } from '@/lib/utils';
import { ArrowLeft, User, Mail, GraduationCap, Globe, MapPin, Bell } from 'lucide-react';

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 
  'France', 'Japan', 'South Korea', 'Singapore', 'India', 'Other'
];

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

export default function RegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<StudentRegistrationInput>({
    resolver: zodResolver(studentRegistrationSchema),
    defaultValues: {
      emailPreference: true
    }
  });

  const selectedCountry = watch('country');

  const onSubmit = async (data: StudentRegistrationInput) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      // Redirect to success page or dashboard
      router.push(`/dashboard/${result.data.id}`);
    } catch (error) {
      console.error('Registration error:', error);
      setSubmitError(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Join Student Prep
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Create your account to start your personalized learning journey with AI-powered assignments and progress tracking.
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Field */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  id="name"
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                    errors.name ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Enter your full name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  id="email"
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                    errors.email ? "border-red-300" : "border-gray-300"
                  )}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Grade Field */}
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  <GraduationCap className="w-4 h-4 inline mr-2" />
                  Grade Level
                </label>
                <select
                  {...register('grade', { valueAsNumber: true })}
                  id="grade"
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                    errors.grade ? "border-red-300" : "border-gray-300"
                  )}
                >
                  <option value="">Select your grade</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-600">{errors.grade.message}</p>
                )}
              </div>

              {/* Country Field */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                  <Globe className="w-4 h-4 inline mr-2" />
                  Country
                </label>
                <select
                  {...register('country')}
                  id="country"
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                    errors.country ? "border-red-300" : "border-gray-300"
                  )}
                >
                  <option value="">Select your country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                {errors.country && (
                  <p className="mt-1 text-sm text-red-600">{errors.country.message}</p>
                )}
              </div>

              {/* State Field (conditional) */}
              {(selectedCountry === 'United States' || selectedCountry === 'Canada') && (
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    State/Province
                  </label>
                  <input
                    {...register('state')}
                    type="text"
                    id="state"
                    className={cn(
                      "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors",
                      errors.state ? "border-red-300" : "border-gray-300"
                    )}
                    placeholder={selectedCountry === 'United States' ? 'Enter your state' : 'Enter your province'}
                  />
                  {errors.state && (
                    <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                  )}
                </div>
              )}

              {/* Email Preference */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <input
                  {...register('emailPreference')}
                  type="checkbox"
                  id="emailPreference"
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <label htmlFor="emailPreference" className="block text-sm font-medium text-gray-700">
                    <Bell className="w-4 h-4 inline mr-2" />
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Receive weekly progress reports and assignment reminders via email.
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full py-3 px-4 rounded-lg font-medium transition-colors",
                  "bg-blue-600 hover:bg-blue-700 text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  isSubmitting && "animate-pulse"
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </span>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Terms */}
            <p className="text-xs text-gray-500 text-center mt-6">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}