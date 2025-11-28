# SKS - Smart knowlegde system

A secure, AI-powered document management built with NestJS and TypeScript, supporting summarization, categorization and file organization.

## 🚀 Features

### Core Features


### Security Features
- JWT-based authentication
- Email verification system
- Password reset functionality
- Role-based permissions
- Rate limiting and security headers

## 🏗️ Architecture

```
src/
├── database/               # Database layer
│   ├── entities/          # TypeORM entities
│   ├── repositories/      # Custom repositories
│   └── migrations/        # Database migrations
├── modules/
│   ├── auth/             # Authentication module
│   ├── wallet/           # Wallet management
│   └── admin/            # Admin operations
├── common/
│   ├── guards/           # Route guards
│   ├── decorators/       # Custom decorators
│   └── interfaces/       # Common interfaces
└── config/               # Configuration files
```

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Docker & Docker Compose

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd sks
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Database Setup

```bash
# Start PostgreSQL with Docker
docker-compose up -d

# Run migrations
npm run migration:run

# Seed data (optional)
npm run seed:admin
npm run seed:prompts
```

### 4. Start Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📊 Database Schema

### Core Entities
#### Users
#### Documents
#### Summaries
#### Chunks

## 🗄️ Database Operations

### Migrations
```bash
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

### Development Environment
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs postgres

# Stop services
docker-compose down
```

## 🐳 Running the Application with Docker

### Prerequisites
- Ensure your `.env` file is configured with the correct database host:
  ```
  DATABASE_HOST=postgres
  ```
- Make sure all required environment variables are set (e.g., OPENAI_API_KEY, JWT_SECRET, SMTP credentials, etc.)

### Start the Application
```bash
# Start all services (PostgreSQL and App)
docker-compose up -d

# View logs for the app
docker-compose logs -f app

# View logs for the database
docker-compose logs postgres
```

### Access the Application
- **API**: `http://localhost:3000`
- **Database**: `localhost:5432` 

### Stop the Application
```bash
docker-compose down
```

## 🧪 Testing (Incoming)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📈 Monitoring & Logging (Incoming)

### Audit Logging
All operations are logged with:
- User identification
- Action performed
- Resource affected
- Timestamp and metadata

### Health Checks
- Database connectivity
- Redis availability
- Service health status

## 🔧 Configuration

### Environment Variables
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

#GMAIL
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASS=smtp_password
APPROVAL_LINK=https:/localhost:3000

#Open AI
OPENAI_API_KEY= <OPENAI_API_KEY>

## 🔒 Security Considerations

### Best Practices
- Always use HTTPS in production
- Regularly rotate JWT secrets
- Use strong passwords and 2FA
- Keep dependencies updated

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
