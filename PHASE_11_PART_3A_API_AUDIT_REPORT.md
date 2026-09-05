# PHASE 11 PART 3A — ADMINISTRATOR PORTAL API INTEGRATION
## STEP A: API AUDIT REPORT

**Date**: August 13, 2026  
**Status**: COMPLETED ✅  
**Objective**: Document all backend REST API endpoints for Administrator Portal integration

---

## EXECUTIVE SUMMARY

The backend provides a complete REST API with:
- **60+ protected endpoints** across 12 modules
- **JWT Authentication** with role-based access control (RBAC)
- **Consistent response structure** with pagination support
- **CRUD operations** for all master data and transactional entities
- **Standard patterns**: pagination, search, filtering, nested relations

All endpoints are protected with `@UseGuards(JwtAuthGuard, RolesGuard)` and require JWT Bearer token authentication.

---

## RESPONSE STRUCTURE PATTERNS

### Single Entity Response
```typescript
{
  success: true,
  statusCode: 200,
  message: "Entity retrieved successfully",
  data: { ...entity }
}
```

### Paginated List Response
```typescript
{
  success: true,
  statusCode: 200,
  message: "Entities retrieved successfully",
  data: {
    data: [...entities],
    meta: {
      page: 1,
      limit: 10,
      total: 100,
      totalPages: 10,
      hasNextPage: true,
      hasPreviousPage: false
    }
  }
}
```

---

## MODULE 1: AUTHENTICATION

**Base URL**: `/api/auth`  
**Description**: JWT authentication (Custom, not Keycloak)

| Method | Endpoint | Roles | Description | Request Body | Response |
|--------|----------|-------|-------------|--------------|----------|
| POST | `/login` | Public | Login with email/password | `{ email, password }` | `{ access_token, user: { id, full_name, email, role: { code, name } } }` |
| GET | `/me` | All authenticated | Get current user profile | None | `ResponseUserDto` with nested role |

**Notes**:
- Password hashing: bcrypt (rounds: 10)
- JWT expiration: configured in .env (default: 1d)
- Test users: admin@lab.com, laboran@lab.com, lecturer@lab.com (password: password123)

---

## MODULE 2: ROLES

**Base URL**: `/api/roles`  
**Access**: ADMIN only (all operations)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all roles (paginated) | `page`, `limit`, `search` | `PaginatedResponseDto<ResponseRoleDto>` |
| POST | `/` | Create new role | - | `ResponseRoleDto` |
| GET | `/:id` | Get role by ID | - | `ResponseRoleDto` |
| PATCH | `/:id` | Update role | - | `ResponseRoleDto` |
| DELETE | `/:id` | Delete role | - | `204 No Content` |

**ResponseRoleDto Structure**:
```typescript
{
  id: string // UUID
  code: string // ADMIN, LABORAN, DOSEN
  name: string
  description: string
  created_at: Date
  updated_at: Date
}
```

**Search**: Searches across `code`, `name`, `description`

---

## MODULE 3: USERS

**Base URL**: `/api/users`  
**Access**: ADMIN only (all operations)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all users (paginated) | `page`, `limit`, `search`, `role_id`, `status` | `PaginatedResponseDto<ResponseUserDto>` |
| POST | `/` | Create new user | - | `ResponseUserDto` |
| GET | `/:id` | Get user by ID | - | `ResponseUserDto` |
| PATCH | `/:id` | Update user | - | `ResponseUserDto` |
| DELETE | `/:id` | Delete user | - | `204 No Content` |

**ResponseUserDto Structure**:
```typescript
{
  id: string
  role_id: string
  keycloak_id: string | null // nullable (not required)
  full_name: string
  email: string
  phone: string | null
  status: UserStatus // ACTIVE | INACTIVE
  created_at: Date
  updated_at: Date
  role: {
    id: string
    code: string // ADMIN, LABORAN, DOSEN
    name: string
  }
}
```

**Search**: Searches across `full_name`, `email`, `phone`  
**Filters**: `role_id` (UUID), `status` (ACTIVE | INACTIVE)  
**Note**: Password field NOT exposed in responses (security)

---

## MODULE 4: LABORATORIES

**Base URL**: `/api/laboratories`  
**Access**: GET (ADMIN, LABORAN, DOSEN), Write (ADMIN only)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all laboratories | `page`, `limit`, `search`, `status` | Paginated labs |
| POST | `/` | Create laboratory | - | Laboratory entity |
| GET | `/:id` | Get laboratory by ID | - | Laboratory entity |
| PATCH | `/:id` | Update laboratory | - | Laboratory entity |
| DELETE | `/:id` | Delete laboratory | - | `204 No Content` |

**Entity Structure**:
```typescript
{
  id: string
  code: string // LAB-001
  name: string
  capacity: number
  status: LaboratoryStatus // ACTIVE | INACTIVE | MAINTENANCE
  created_at: Date
  updated_at: Date
}
```

**Search**: `code`, `name`  
**Filter**: `status` (ACTIVE | INACTIVE | MAINTENANCE)

---

## MODULE 5: FACILITIES

**Base URL**: `/api/facilities`  
**Access**: ADMIN only

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all facilities | `page`, `limit`, `search`, `laboratory_id`, `status` | Paginated facilities |
| POST | `/` | Create facility | - | Facility entity |
| GET | `/:id` | Get facility by ID | - | Facility entity |
| PATCH | `/:id` | Update facility | - | Facility entity |
| DELETE | `/:id` | Delete facility | - | `204 No Content` |

**Entity Structure**:
```typescript
{
  id: string
  laboratory_id: string
  name: string
  quantity: number
  status: FacilityStatus // AVAILABLE | UNAVAILABLE | DAMAGED
  created_at: Date
  updated_at: Date
  laboratory?: { id, code, name } // Optional nested
}
```

**Search**: `name`  
**Filters**: `laboratory_id`, `status`

---

## MODULE 6: ACADEMIC CALENDARS

**Base URL**: `/api/academic-calendars`  
**Access**: ADMIN only

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all calendars | `page`, `limit`, `search`, `status` | Paginated calendars |
| POST | `/` | Create calendar | - | Calendar entity |
| GET | `/:id` | Get calendar by ID | - | Calendar entity |
| PATCH | `/:id` | Update calendar | - | Calendar entity |
| DELETE | `/:id` | Delete calendar | - | `204 No Content` |

**Entity Structure**:
```typescript
{
  id: string
  academic_year: string // "2024/2025"
  semester: string // "Ganjil" | "Genap"
  start_date: Date
  end_date: Date
  status: CalendarStatus // ACTIVE | INACTIVE
  created_at: Date
  updated_at: Date
}
```

**Search**: `academic_year`, `semester`  
**Filter**: `status`

---

## MODULE 7: OPERATIONAL HOURS

**Base URL**: `/api/operational-hours`  
**Access**: ADMIN only

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all operational hours | `page`, `limit`, `search`, `laboratory_id` | Paginated hours |
| POST | `/` | Create operational hour | - | Operational hour entity |
| GET | `/:id` | Get by ID | - | Operational hour entity |
| PATCH | `/:id` | Update | - | Operational hour entity |
| DELETE | `/:id` | Delete | - | `204 No Content` |

**Entity Structure**:
```typescript
{
  id: string
  laboratory_id: string
  day_of_week: number // 0=Sunday, 1=Monday, ..., 6=Saturday
  open_time: Date // Time stored as datetime
  close_time: Date
  is_closed: boolean
  created_at: Date
  updated_at: Date
  laboratory?: { id, code, name }
}
```

**Search**: Laboratory name  
**Filter**: `laboratory_id`

---

## MODULE 8: ANNOUNCEMENTS

**Base URL**: `/api/announcements`  
**Access**: ADMIN only

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all announcements | `page`, `limit`, `search`, `status` | Paginated announcements |
| POST | `/` | Create announcement | - | Announcement entity |
| GET | `/:id` | Get by ID | - | Announcement entity |
| PATCH | `/:id` | Update | - | Announcement entity |
| DELETE | `/:id` | Delete | - | `204 No Content` |

**Entity Structure**:
```typescript
{
  id: string
  title: string
  content: string
  status: AnnouncementStatus // ACTIVE | INACTIVE
  created_at: Date
  updated_at: Date
}
```

**Search**: `title`, `content`  
**Filter**: `status`

---

## MODULE 9: SCHEDULES

**Base URL**: `/api/schedules`  
**Access**: GET (ADMIN, LABORAN, DOSEN), Write (ADMIN only)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all schedules | `page`, `limit`, `search`, `academic_calendar_id`, `laboratory_id`, `status` | Paginated schedules |
| POST | `/` | Create schedule | - | Schedule entity |
| GET | `/:id` | Get by ID | - | Schedule entity |
| PATCH | `/:id` | Update | - | Schedule entity |
| DELETE | `/:id` | Delete | - | `204 No Content` |

**ResponseScheduleDto Structure**:
```typescript
{
  id: string
  laboratory_id: string
  academic_calendar_id: string
  course_name: string
  lecturer_name: string
  class_name: string
  day_of_week: number // 0-6
  start_time: Date // Time stored as datetime
  end_time: Date
  status: ScheduleStatus // SCHEDULED | CANCELLED | COMPLETED
  created_at: Date
  updated_at: Date
  laboratory?: { id, code, name }
  academicCalendar?: { id, academic_year, semester }
}
```

**Search**: `course_name`, `lecturer_name`, `class_name`  
**Filters**: `academic_calendar_id`, `laboratory_id`, `status`

---

## MODULE 10: ROOM REQUESTS

**Base URL**: `/api/room-requests`  
**Access**: GET (ADMIN, LABORAN, DOSEN), POST (DOSEN), PATCH (ADMIN, DOSEN), DELETE (ADMIN, DOSEN)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all requests | `page`, `limit`, `search`, `status`, `laboratory_id`, `applicant_id` | Paginated requests |
| POST | `/` | Create request (DOSEN) | - | Request entity |
| GET | `/:id` | Get by ID | - | Request entity |
| PATCH | `/:id` | Update request | - | Request entity |
| DELETE | `/:id` | Delete request | - | `204 No Content` |

**ResponseRoomRequestDto Structure**:
```typescript
{
  id: string
  applicant_id: string
  laboratory_id: string
  approved_by: string | null
  activity_name: string
  course_name: string | null
  class_name: string | null
  description: string
  request_date: Date
  start_time: Date
  end_time: Date
  participant_count: number
  status: RequestStatus // PENDING | APPROVED | REJECTED | CANCELLED
  rejection_reason: string | null
  approved_at: Date | null
  created_at: Date
  updated_at: Date
  applicant?: { id, full_name, email }
  approver?: { id, full_name, email } | null
  laboratory?: { id, code, name }
}
```

**Search**: `activity_name`, `course_name`, `class_name`  
**Filters**: `status`, `laboratory_id`, `applicant_id`

---

## MODULE 11: ROOM USAGE

**Base URL**: `/api/room-usage`  
**Access**: GET (ADMIN, LABORAN), POST (LABORAN), PATCH (LABORAN), DELETE (ADMIN)

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/` | Get all usage | `page`, `limit`, `search`, `status` | Paginated usage |
| POST | `/` | Create usage (check-in) | - | Usage entity |
| GET | `/:id` | Get by ID | - | Usage entity |
| PATCH | `/:id` | Update (check-out) | - | Usage entity |
| DELETE | `/:id` | Delete usage | - | `204 No Content` |

**Entity Structure**:
```typescript
{
  id: string
  room_request_id: string
  user_id: string
  laboratory_id: string
  check_in_time: Date
  check_out_time: Date | null
  actual_participant_count: number
  notes: string | null
  status: UsageStatus // CHECKED_IN | CHECKED_OUT | OVERTIME
  created_at: Date
  updated_at: Date
  // Nested relations: room_request, user, laboratory
}
```

**Search**: User name, notes  
**Filter**: `status`

---

## MODULE 12: DASHBOARD

**Base URL**: `/api/dashboard`  
**Access**: ADMIN only

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/` | Overall summary | `DashboardSummaryDto` |
| GET | `/statistics` | Alias for summary | `DashboardSummaryDto` |
| GET | `/laboratories` | Lab statistics | `LaboratoryStatisticDto[]` |
| GET | `/requests` | Request statistics | `RequestStatisticDto[]` |
| GET | `/usage` | Usage statistics | `UsageStatisticDto` |
| GET | `/occupancy` | Occupancy per lab | `OccupancyStatisticDto[]` |

**DashboardSummaryDto**:
```typescript
{
  total_laboratories: number
  active_laboratories: number
  inactive_laboratories: number
  total_schedules: number
  today_schedules: number
  total_room_requests: number
  pending_requests: number
  approved_requests: number
  rejected_requests: number
  current_room_usage: number
  active_announcements: number
}
```

---

## MODULE 13: REPORTS

**Base URL**: `/api/reports`  
**Access**: ADMIN only

| Method | Endpoint | Description | Query Params | Response |
|--------|----------|-------------|--------------|----------|
| GET | `/usage` | Usage report | `start_date`, `end_date`, `laboratory_id`, `status`, `user_id`, `page`, `limit` | Paginated `UsageReportDto` |
| GET | `/requests` | Request report | `start_date`, `end_date`, `laboratory_id`, `status`, `user_id`, `page`, `limit` | Paginated `RequestReportDto` |
| GET | `/schedules` | Schedule report | `laboratory_id`, `status`, `page`, `limit` | Paginated `ScheduleReportDto` |
| GET | `/laboratories` | Lab report | `status`, `page`, `limit` | Paginated `LaboratoryReportDto` |
| GET | `/summary` | Summary report | `start_date`, `end_date` | `SummaryReportDto` |

**All reports support date range filtering and pagination**

---

## FRONTEND-BACKEND MAPPING ANALYSIS

### ROLES PAGE MAPPING

**Frontend Mock Structure** (`admin-roles.mock.ts`):
```typescript
{
  id: string
  name: string
  code: string // ADMIN, LABORAN, DOSEN, PUBLIC
  description: string
  usersCount: number // NOT in backend
  permissionsLevel: string // NOT in backend
  permissionBadgeClass: string // Frontend only
  isSystem: boolean // NOT in backend
  status: 'Active' | 'Inactive' // NOT in backend
  icon: Component // Frontend only
  permissionsList: string[] // NOT in backend
  updatedAt: string
}
```

**Backend Response** (`ResponseRoleDto`):
```typescript
{
  id: string
  code: string
  name: string
  description: string
  created_at: Date
  updated_at: Date
}
```

**GAPS**:
- ❌ `usersCount`: Not provided by backend (need to count users per role manually or add to backend)
- ❌ `permissionsLevel`, `permissionBadgeClass`, `icon`, `permissionsList`: Frontend-only UI metadata
- ❌ `status`: Backend roles don't have status field
- ❌ `isSystem`: Backend doesn't mark system roles

**INTEGRATION STRATEGY**:
1. Use backend for: `id`, `code`, `name`, `description`, `updated_at`
2. Derive frontend metadata: map `code` → `permissionsLevel`, `icon`, `permissionsList`
3. Count users: Fetch users filtered by `role_id` or add computed field to backend
4. Set default `status: 'Active'` and `isSystem: true` for ADMIN/LABORAN/DOSEN

---

### USERS PAGE MAPPING

**Frontend Mock Structure** (`admin-users.mock.ts`):
```typescript
{
  id: string
  fullName: string
  email: string
  phone: string
  role: 'Administrator' | 'Laboran' | 'Dosen / Pemohon' // Display name
  status: 'Active' | 'Inactive'
  registered: string // Formatted date
  lastActive: string // NOT in backend
  avatarBgClass: string // Frontend only
  avatarTextClass: string // Frontend only
}
```

**Backend Response** (`ResponseUserDto`):
```typescript
{
  id: string
  full_name: string
  email: string
  phone: string | null
  role: { id, code, name } // Nested
  status: UserStatus // ACTIVE | INACTIVE
  created_at: Date
  updated_at: Date
}
```

**MAPPING**:
- ✅ Direct map: `id`, `email`, `phone`, `status`
- ✅ Transform: `fullName` ← `full_name`
- ✅ Transform: `role` ← map `role.name` or `role.code` to display name
- ✅ Transform: `registered` ← format `created_at`
- ❌ `lastActive`: Not provided by backend (set default "N/A" or add to backend)
- ✅ `avatarBgClass`: Derive from `role.code`

---

## NEXT STEPS (STEP B - STEP G)

### ✅ STEP A: API AUDIT — COMPLETED

### 🔜 STEP B: SHARED API INFRASTRUCTURE VERIFICATION
- Verify `frontend/src/services/api.ts` JWT interceptors working
- Test pagination handling with backend meta structure
- Test error handling (401/403/404/500)

### 🔜 STEP C: ADMINISTRATOR MASTER DATA INTEGRATION
**Priority Order**:
1. **Roles** (simplest, no relations)
2. **Users** (depends on roles)
3. **Laboratories**
4. **Facilities** (depends on laboratories)
5. **Academic Calendars**
6. **Operational Hours** (depends on laboratories)
7. **Announcements**

**For Each Feature**:
1. Inspect Admin page (e.g., `RolesPage.vue`)
2. Identify mock service (e.g., `role.service.ts`)
3. Map frontend types to backend DTOs
4. Replace mock methods with real API calls
5. Update UI components to handle backend response structure
6. Test CRUD operations (Create → Refresh → Verify persistence)
7. Test pagination, search, filtering

### 🔜 STEP D: ADMINISTRATOR TRANSACTIONS
1. Schedules
2. Room Requests
3. Room Usage

### 🔜 STEP E: DASHBOARD/REPORTS
1. Dashboard widgets
2. Reports pages

### 🔜 STEP F: PROFILE/SETTINGS
1. User profile update
2. Password change

### 🔜 STEP G: FINAL INTEGRATION TESTING
1. End-to-end CRUD flows
2. Authorization testing (role isolation)
3. Data persistence verification
4. Error handling validation

---

## AUTHENTICATION & AUTHORIZATION MATRIX

| Module | GET | POST | PATCH | DELETE |
|--------|-----|------|-------|--------|
| Auth | Public | Public | - | - |
| Roles | ADMIN | ADMIN | ADMIN | ADMIN |
| Users | ADMIN | ADMIN | ADMIN | ADMIN |
| Laboratories | ALL | ADMIN | ADMIN | ADMIN |
| Facilities | ADMIN | ADMIN | ADMIN | ADMIN |
| Academic Calendars | ADMIN | ADMIN | ADMIN | ADMIN |
| Operational Hours | ADMIN | ADMIN | ADMIN | ADMIN |
| Announcements | ADMIN | ADMIN | ADMIN | ADMIN |
| Schedules | ALL | ADMIN | ADMIN | ADMIN |
| Room Requests | ALL | DOSEN | ADMIN/DOSEN | ADMIN/DOSEN |
| Room Usage | ADMIN/LABORAN | LABORAN | LABORAN | ADMIN |
| Dashboard | ADMIN | - | - | - |
| Reports | ADMIN | - | - | - |

**Legend**: ALL = ADMIN, LABORAN, DOSEN

---

## CRITICAL NOTES FOR INTEGRATION

### ✅ PRESERVE
- All authentication logic (COMPLETE and STABLE)
- Existing Administrator Portal UI design
- Glass-morphism styles, colors, layouts
- User experience flows

### ⚠️ HANDLE CAREFULLY
- Date/Time formatting: Backend returns ISO 8601 strings, frontend displays formatted
- Role code mapping: Backend `DOSEN`, Frontend displays "Dosen / Pemohon" or "Lecturer"
- Nullable fields: Backend uses `| null`, frontend may use optional `?`
- Pagination: Backend uses `meta`, frontend may use different structure
- Search: Backend searches specific fields, document which fields per module

### 🚫 DO NOT
- Modify backend authentication or RBAC
- Change database schema or create migrations
- Modify backend response structures
- Bypass authorization checks
- Store passwords or tokens in localStorage unencrypted

---

## TEST ENVIRONMENT

**Backend**: http://localhost:3000 (Running on terminal 5)  
**Frontend**: http://localhost:5173 (Running on terminal 6)

**Test Credentials**:
- Admin: admin@lab.com / password123
- Laboran: laboran@lab.com / password123
- Lecturer: lecturer@lab.com / password123

**Database**: Seeded with test data (3 roles, 3 users, sample master data)

---

## STATUS: STEP A COMPLETE ✅

**Next Action**: Proceed to STEP B - Shared API Infrastructure Verification

**Deliverables**:
- ✅ Complete API endpoint documentation (60+ endpoints)
- ✅ Response structure patterns documented
- ✅ Frontend-backend mapping analysis
- ✅ Integration gaps identified
- ✅ Authorization matrix documented
- ✅ Next steps roadmap defined

**Time Estimate for Remaining Steps**:
- STEP B: ~30 minutes
- STEP C: ~3-4 hours (7 features × 30 min each)
- STEP D: ~2 hours
- STEP E: ~1 hour
- STEP F: ~30 minutes
- STEP G: ~1 hour

**Total**: ~8 hours of focused integration work

---

**Report Generated**: August 13, 2026  
**Agent**: Kiro AI  
**Phase**: 11 Part 3A - Administrator Portal API Integration  
**Step**: A - API Audit ✅ COMPLETE
