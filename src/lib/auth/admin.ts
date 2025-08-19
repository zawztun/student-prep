import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export interface AdminUser {
  id: string
  email: string
  name: string
}

export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId, isActive: true },
      select: { id: true, email: true, name: true }
    })
    
    return admin
  } catch (error) {
    return null
  }
}

export async function authenticateAdmin(email: string, password: string): Promise<string | null> {
  try {
    const admin = await prisma.admin.findUnique({
      where: { email, isActive: true }
    })
    
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return null
    }
    
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )
    
    return token
  } catch (error) {
    return null
  }
}

export async function requireAdminAuth(request: NextRequest): Promise<AdminUser | Response> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  const token = authHeader.substring(7)
  const admin = await verifyAdminToken(token)
  
  if (!admin) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    )
  }
  
  return admin
}