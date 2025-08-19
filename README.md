# Student Prep Application

A comprehensive student preparation platform with automated assignment delivery, progress tracking, and personalized study plans.

## Features

### Release 1.0 (Completed)
- ✅ Student registration system with email preferences
- ✅ Country-specific state/province selection
- ✅ Student dashboard with analytics
- ✅ PostgreSQL database with Prisma ORM
- ✅ Responsive UI with Tailwind CSS
- ✅ Form validation with Zod

### Release 2.0 (Planned)
- 🔄 Question management system
- 🔄 Localized question generation
- 🔄 Admin interface for content management
- 🔄 Question bank with difficulty levels

### Release 3.0 (Planned)
- 🔄 Automated assignment scheduling
- 🔄 Email delivery system with Resend
- 🔄 Auto-grading functionality
- 🔄 Weekly progress reports
- 🔄 Vercel Cron Jobs integration

## Tech Stack

- **Framework:** Next.js 15 with TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Email:** Resend (planned)
- **Testing:** Playwright
- **Deployment:** Vercel (planned)

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/student-prep.git
cd student-prep
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Update `.env.local` with your database credentials:
```
DATABASE_URL="postgresql://username:password@localhost:5432/student_prep"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
student-prep/
├── app/                    # Next.js 15 app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Student dashboard
│   ├── register/          # Registration page
│   └── globals.css        # Global styles
├── lib/                   # Utility functions
├── prisma/               # Database schema and seed
├── tests/                # Playwright tests
├── types/                # TypeScript type definitions
└── docs/                 # Project documentation
```

## API Endpoints

### Students
- `POST /api/students` - Create new student
- `GET /api/students/[id]` - Get student by ID
- `PUT /api/students/[id]` - Update student

### Study Plans
- `POST /api/study-plans` - Create study plan
- `GET /api/study-plans/[id]` - Get study plan

### Analytics
- `GET /api/analytics/students/[id]` - Get student analytics

## Testing

Run Playwright tests:
```bash
npx playwright test
```

Run specific test suite:
```bash
npx playwright test tests/release-1/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

- [ ] Complete Release 2.0 features
- [ ] Implement email service integration
- [ ] Add comprehensive test coverage
- [ ] Deploy to production
- [ ] Add internationalization support
- [ ] Implement advanced analytics

## Support

For support, please open an issue on GitHub or contact the development team.# student-prep
