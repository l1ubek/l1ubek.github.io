# User Management SPA

A single page application for user management built with Next.js, React, and PostgreSQL.

## Features

- User authentication (login/logout)
- Role-based access control (admin/user)
- User CRUD operations (Create, Read, Update, Delete)
- Responsive design with Tailwind CSS
- RESTful API with JSON data exchange
- JWT token-based authentication

## Prerequisites

- Node.js 18+ 
- Docker (for PostgreSQL database)
- Git

## Setup Instructions

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd user-management-spa
\`\`\`

### 2. Start PostgreSQL Database

Make sure Docker is running, then start the PostgreSQL container:

\`\`\`bash
docker run --name postgres-db -e POSTGRES_USER=myuser -e POSTGRES_PASSWORD=mysecretpassword -e POSTGRES_DB=postgres -p 5430:5432 -d postgres:15
\`\`\`

### 3. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 4. Initialize Database

Run the database initialization script:

\`\`\`bash
npm run db:init
\`\`\`

This will create the users table and insert default users:
- Admin user: username \`admin\`, password \`admin123\`
- Regular user: username \`user\`, password \`user123\`

### 5. Start the Application

\`\`\`bash
npm run dev
\`\`\`

The application will be available at \`http://localhost:8000\`

## Default Users

- **Admin User**: 
  - Username: \`admin\`
  - Password: \`admin123\`
  - Can create, read, update, and delete users

- **Regular User**: 
  - Username: \`user\`
  - Password: \`user123\`
  - Can only view users list

## API Endpoints

- \`POST /api/auth/login\` - User login
- \`GET /api/auth/validate\` - Validate JWT token
- \`GET /api/users\` - Get all users
- \`POST /api/users\` - Create new user (admin only)
- \`PUT /api/users/[id]\` - Update user (admin only)
- \`DELETE /api/users/[id]\` - Delete user (admin only)

## Technology Stack

- **Frontend**: React 18, Next.js 14, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: PostgreSQL
- **Authentication**: JWT tokens, bcrypt for password hashing
- **Linting**: ESLint with Airbnb configuration

## Code Quality

- Follows Airbnb JavaScript style guide
- 4 spaces indentation
- Maximum 400 lines per file
- Maximum 75 lines per function
- Single responsibility principle applied
- No commented code in production

## Browser Support

Tested and supported on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development Commands

- \`npm run dev\` - Start development server on port 8000
- \`npm run build\` - Build for production
- \`npm run start\` - Start production server
- \`npm run lint\` - Run ESLint
- \`npm run db:init\` - Initialize database with default data

## Environment Variables

Create a \`.env.local\` file for production:

\`\`\`
JWT_SECRET=your-super-secret-jwt-key-here
\`\`\`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- SQL injection prevention with parameterized queries
