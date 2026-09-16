# Laboratory Schedule Display System - Backend API

A comprehensive REST API for managing laboratory schedules, room requests, and usage tracking.

## Tech Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL 17
- **ORM**: Prisma 7
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## Features

### Core Modules (CRUD)
- ✅ Role Management
- ✅ User Management
- ✅ Laboratory Management
- ✅ Facility Management
- ✅ Academic Calendar Management
- ✅ Operational Hours Management
- ✅ Announcement Management

### Transaction Modules
- ✅ Schedule Management (with business rules validation)
- ✅ Room Request Management (approval workflow)
- ✅ Room Usage Tracking (check-in/check-out system)

### Analytics & Reporting
- ✅ Display API (public laboratory display)
- ✅ Dashboard API (admin statistics)
- ✅ Reports API (filtered evaluation data)

## API Endpoints

**Total: 67 endpoints**
- 50 CRUD endpoints (10 modules × 5 operations)
- 6 Display endpoints
- 6 Dashboard endpoints
- 5 Report endpoints

### Base URL
- Development: `http://localhost:3000/api`
- Production: Configure via `PORT` and API prefix

### API Documentation
- Swagger UI: `http://localhost:3000/docs`

## Prerequisites

- Node.js 18+ or 20+
- PostgreSQL 17
- npm or yarn

## Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Edit .env with your configuration
# DATABASE_URL, PORT, CORS_ORIGIN, etc.
```

## Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Open Prisma Studio (database GUI)
npm run prisma:studio
```

## Development

```bash
# Run in development mode (with watch)
npm run start:dev

# Run in debug mode
npm run start:debug

# Format code
npm run format

# Lint code
npm run lint
```

## Build & Production

```bash
# Build for production
npm run build

# Run production build
npm run start:prod
```

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run e2e tests
npm run test:e2e
```

## Environment Variables

```env
# Application
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname?schema=public

# JWT (for future auth implementation)
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1d
```

## Production Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Database Migration
```bash
npm run prisma:migrate:deploy
```

### 3. Environment Configuration
- Set `NODE_ENV=production`
- Configure production database URL
- Set secure JWT secret
- Configure CORS origins
- Set appropriate port

### 4. Start Production Server
```bash
npm run start:prod
```

### 5. Process Management (Recommended)
Use PM2 or similar:
```bash
pm2 start dist/main.js --name lab-api
```

## Architecture

### Clean Architecture Layers
```
├── src/
│   ├── common/           # Shared utilities, DTOs, filters, interceptors
│   ├── config/           # Configuration modules
│   ├── modules/          # Feature modules
│   │   ├── role/
│   │   ├── users/
│   │   ├── laboratory/
│   │   ├── schedule/
│   │   ├── room-request/
│   │   ├── room-usage/
│   │   ├── display/
│   │   ├── dashboard/
│   │   └── reports/
│   ├── prisma/           # Prisma service
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma     # Database schema
│   ├── migrations/       # Database migrations
│   └── seed.ts          # Seed data
```

### Design Patterns
- **Dependency Injection**: NestJS IoC container
- **Repository Pattern**: Prisma ORM abstraction
- **DTO Pattern**: Request/Response validation
- **Interceptor Pattern**: Global response formatting
- **Filter Pattern**: Global exception handling

## API Response Format

All endpoints return consistent response format via `ResponseInterceptor`:

### Success Response
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

## Business Rules

### Schedule Module
- Academic calendar must be ACTIVE
- Laboratory cannot be CLOSED or MAINTENANCE
- Schedule must be within operational hours
- No schedule conflicts (same lab, same time)
- Start time must be before end time

### Room Request Module
- Applicant and laboratory must exist
- Academic calendar must be ACTIVE
- Laboratory cannot be CLOSED or MAINTENANCE
- Request must be within operational hours
- No duplicate requests
- No conflicts with approved requests
- No conflicts with fixed schedules
- Status transitions: PENDING → APPROVED/REJECTED/CANCELLED

### Room Usage Module
- Only from APPROVED room requests
- One usage per request
- Laboratory cannot be CLOSED or MAINTENANCE
- Check-in time validation
- Status flow: CHECKED_IN → IN_USE → CHECKED_OUT
- Automatic laboratory status synchronization
- Automatic status history logging

## Performance Optimizations

- ✅ Parallel queries with `Promise.all()`
- ✅ Prisma `select` over `include` where appropriate
- ✅ Indexed database columns
- ✅ Pagination for large datasets
- ✅ No N+1 query problems

## Security Best Practices

- ✅ Input validation with `class-validator`
- ✅ Data sanitization with DTOs
- ✅ CORS configuration
- ✅ Environment variable management
- ✅ Error message sanitization
- ⏳ Authentication (Keycloak - future phase)
- ⏳ Authorization (Role-based - future phase)

## Monitoring & Logging

### Application Logs
- NestJS built-in logger
- Console output in development
- File/service logging in production (configure as needed)

### Database Monitoring
- Prisma query logging
- Connection pool monitoring

## Troubleshooting

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL format
- Verify credentials and database exists
- Check network/firewall settings

### Migration Issues
```bash
# Reset database (development only)
npm run prisma:reset

# Force re-generate Prisma Client
npm run prisma:generate
```

## Contributing

1. Follow NestJS best practices
2. Use existing architectural patterns
3. Add proper validation and error handling
4. Document new endpoints in Swagger
5. Maintain backward compatibility
6. Write tests for new features

## License

Private/Proprietary - Tugas Akhir (Final Project)

## Support

For issues and questions, contact the development team.
