# Endpoint Protection Strategy

This document outlines which endpoints require authentication and role-based authorization.

## Authentication Required - Role: ADMIN

These endpoints require JWT authentication and ADMIN role:

### Already Protected:
- `/api/users` - All endpoints (✅ DONE)
- `/api/roles` - All endpoints (✅ DONE)

### To Be Protected:
- `/api/laboratories` - All CRUD endpoints
- `/api/facilities` - All CRUD endpoints
- `/api/academic-calendars` - All CRUD endpoints
- `/api/operational-hours` - All CRUD endpoints
- `/api/announcements` - All CRUD endpoints
- `/api/schedules` - All CRUD endpoints
- `/api/room-requests` - Review/approval endpoints (PATCH for approval/rejection)
- `/api/room-usage` - Admin monitoring endpoints
- `/api/dashboard` - Admin dashboard statistics
- `/api/reports` - All report endpoints

## Authentication Required - Multiple Roles

### Room Requests:
- POST `/api/room-requests` - ADMIN, DOSEN (create request)
- GET `/api/room-requests` - ADMIN, LABORAN, DOSEN (filtered by role)
- GET `/api/room-requests/:id` - ADMIN, LABORAN, DOSEN (owner check)
- PATCH `/api/room-requests/:id` - ADMIN (approval), DOSEN (cancel own)
- DELETE `/api/room-requests/:id` - ADMIN, DOSEN (owner check)

### Room Usage:
- POST `/api/room-usage` - ADMIN, LABORAN (check-in)
- GET `/api/room-usage` - ADMIN, LABORAN
- GET `/api/room-usage/:id` - ADMIN, LABORAN
- PATCH `/api/room-usage/:id` - ADMIN, LABORAN (check-out)

### Schedules (Read Access):
- GET `/api/schedules` - ADMIN, LABORAN, DOSEN (authenticated users)
- GET `/api/schedules/:id` - ADMIN, LABORAN, DOSEN

### Laboratories (Read Access):
- GET `/api/laboratories` - ADMIN, LABORAN, DOSEN
- GET `/api/laboratories/:id` - ADMIN, LABORAN, DOSEN

## Public Endpoints (No Authentication)

These endpoints must remain publicly accessible:
- POST `/api/auth/login` - Public login endpoint
- GET `/api/display` - Public display aggregated data
- GET `/api/display/laboratories` - Public laboratory status
- GET `/api/display/schedules` - Public today's schedules
- GET `/api/display/announcements` - Public active announcements
- GET `/api/display/status` - Public laboratory status
- GET `/api/display/usage` - Public current usage

## Implementation Pattern

Add to controller class level:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
```

Add to specific methods:
```typescript
@Roles('ADMIN')  // Single role
@Roles('ADMIN', 'LABORAN')  // Multiple roles
```

For public endpoints in authenticated controllers, skip the method entirely or use a public decorator if needed.
