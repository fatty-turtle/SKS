# SKS

# SKS - Smart Knowledge System

A full-stack, AI-powered document management platform built with NestJS (backend) and React (frontend), supporting summarization, categorization, file organization, and secure user authentication.

## 🚀 Features

### Core Features

- **Document Management**: Upload, organize, and manage documents with advanced search capabilities.
- **AI-Powered Summarization**: Generate summaries and diagrams for uploaded documents using OpenAI integration.
- **Folder Organization**: Create and manage folders to categorize documents.
- **Prompt Management**: Customizable prompts for AI interactions.
- **User Authentication**: Secure login and registration with email verification.
- **Responsive UI**: Modern, mobile-friendly interface built with React and Bootstrap.

### Security Features

- JWT-based authentication
- Email verification system
- Password reset functionality
- Role-based permissions
- Rate limiting and security headers

## 🏗️ Architecture

The application is divided into two main components:

### Backend (NestJS)

```
sks-backend/src/
├── database/               # Database layer
│   ├── entities/          # TypeORM entities
│   ├── repositories/      # Custom repositories
│   └── migrations/        # Database migrations
├── modules/
│   ├── authentication/   # Authentication module
│   ├── document/         # Document management
│   ├── folder/           # Folder operations
│   ├── prompts/          # Prompt management
│   ├── summary/          # Summarization services
│   └── admin/            # Admin operations
├── common/
│   ├── decorators/       # Custom decorators
│   └── llm/              # OpenAI service
└── config/               # Configuration files
```

### Frontend (React)

```
sks-frontend/src/
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   ├── documents/        # Document-related components
│   ├── folders/          # Folder management
│   └── uploadData/       # File upload components
├── service/               # API service layers
├── utils/                 # Utility functions
└── assets/                # Styles and assets
```

## 🛠️ Tech Stack

### Backend

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT, Passport.js
- **AI Integration**: OpenAI API
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest

### Frontend

- **Framework**: React 19.1.1
- **Build Tool**: Vite 7.1.7
- **Styling**: Bootstrap 5.3.8, React Bootstrap 2.10.10
- **Routing**: React Router DOM 7.9.4
- **HTTP Client**: Axios 1.12.2
- **Additional Libraries**: Mermaid for diagrams, JWT-decode, React Icons

## 📋 Prerequisites

- Node.js 18+ (for backend) / 16+ (for frontend)
- PostgreSQL 12+
- Docker & Docker Compose
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd sks-app
```

### 2. Run the application with Docker

```
docker-compose up --build
```

SKS available at: `http://localhost:3000`

### 2. Backend Setup (If Docker does not work)

```bash
cd sks-backend

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration (DATABASE_HOST, JWT_SECRET, OPENAI_API_KEY, SMTP credentials, etc.)

# Database setup
docker-compose up -d

# Run migrations
npm run migration:run

# Seed data
npm run seed:admin
npm run seed:prompts

# Start backend
npm run start:dev
```

### 3. Frontend Setup (If Docker does not work)

```bash
cd ../sks-frontend

# Install dependencies
npm install --force
npm install jwt-decode react-icons mammoth react-doc-viewer react-file-viewer react-router-dom mermaid @mermaid-js/mermaid-mindmap --force

# Start development server
npm run dev
```

### 4. Access the Application

If Docker works:

```
Full app: `http://localhost:3000`
```

If Docker does not work:

```
Frontend: `http://localhost:5173`
Backend API: `http://localhost:3000`
Database: `localhost:5432`
```

## 📊 Database Schema

### Core Entities

- **Users**: User accounts with roles and authentication
- **Documents**: Uploaded files with metadata
- **Summaries**: AI-generated summaries and diagrams
- **Chunks**: Document chunks for processing
- **Folders**: Organizational folders
- **Prompts**: Custom AI prompts

## 🗄️ Database Operations

### Migrations

```bash
cd sks-backend
# Generate migration
npm run migration:generate -- src/database/migrations/MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Seeding

```bash
npm run seed:admin
npm run seed:prompts
```

## 🐳 Docker Setup

### Full Application with Docker

Ensure your `.env` file in `sks-backend` has `DATABASE_HOST=postgres`.

```bash
cd sks-backend
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f app
docker-compose logs postgres

# Stop services
docker-compose down
```

## 🧪 Testing

### Backend

```bash
cd sks-backend
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend

```bash
cd sks-frontend
# Linting
npm run lint
```

## 📈 Monitoring & Logging

### Audit Logging

All operations are logged with user identification, actions, resources affected, timestamps, and metadata.

### Health Checks

- Database connectivity
- Service health status

## 🔧 Configuration

### Environment Variables (Backend)

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=sks_password
DATABASE_NAME=sks

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASS=smtp_password
APPROVAL_LINK=https://localhost:3000

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

## 🔒 Security Considerations

### Best Practices

- Always use HTTPS in production
- Regularly rotate JWT secrets
- Use strong passwords and 2FA
- Keep dependencies updated
- Implement rate limiting

## 🚀 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] SSL certificates installed
- [ ] Monitoring setup
- [ ] Backup strategy implemented
- [ ] Security headers configured

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feat/amazing_feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feat/amazing_feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.
