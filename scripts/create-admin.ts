import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4]
  
  if (!email || !password || !name) {
    console.error('Usage: npx tsx scripts/create-admin.ts <email> <password> <name>')
    process.exit(1)
  }
  
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    })
    
    if (existingAdmin) {
      console.error(`Admin with email ${email} already exists`)
      process.exit(1)
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isActive: true
      }
    })
    
    console.log(`✅ Admin created successfully:`)
    console.log(`   ID: ${admin.id}`)
    console.log(`   Email: ${admin.email}`)
    console.log(`   Name: ${admin.name}`)
    console.log(`   Created: ${admin.createdAt}`)
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()