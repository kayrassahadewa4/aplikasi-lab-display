# SCHEDULES BACKEND CONTRACT ANALYSIS

## STEP A2 & A3: Backend Contract & Mapping

### PRISMA SCHEMA

```prisma
model Schedule {
  id                   String         @id @default(uuid()) @db.Uuid
  laboratory_id        String         @db.Uuid
  academic_calendar_id String         @db.Uuid
  course_name          String         @db.VarChar(100)
  lecturer_name        String         @db.VarChar(100)
  class_name           String         @db.VarChar(30)
  day_of_week          Int            @db.SmallInt
  start_time           DateTime       @db.Time(6)
  end_time             DateTime       @db.Time(6)
  status               ScheduleStatus
  created_at           DateTime       @default(now()) @db.Timestamp(6)
  updated_at           DateTime       @updatedAt @db.Timestamp(6)

  laboratory       Laboratory       @relation(fields: [laboratory_id], references: [id])
  academicCalendar AcademicCalendar @relation(fields: [academic_calendar_id], references: [id])
  roomUsages       RoomUsage[]
}

enum ScheduleStatus {
  SCHEDULED
  ACTIVE
  FINISHED
  CANCELLED
}
```

### BACKEND API ENDPOINTS

**Base Path**: `/api/schedules`

1. **POST `/schedules`** - Create schedule (ADMIN only)
2. **GET `/schedules`** - List with pagination/search/filters (ADMIN, LABORAN, DOSEN)
3. **GET `/schedules/:id`** - Get by ID (ADMIN, LABORAN, DOSEN)
4. **PATCH `/schedules/:id`** - Update schedule (ADMIN only)
5. **DELETE `/schedules/:id`** - Delete schedule (ADMIN only) - Returns 204 No Content

### REQUIRED FIELDS (Create)

- `laboratory_id` (UUID) - REQUIRED
- `academic_calendar_id` (UUID) - REQUIRED
- `course_name` (string, max 100) - REQUIRED
- `lecturer_name` (string, max 100) - REQUIRED
- `class_name` (string, max 30) - REQUIRED
- `day_of_week` (integer 0-6) - REQUIRED
  * **CRITICAL**: 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
- `start_time` (HH:mm:ss format) - REQUIRED
- `end_time` (HH:mm:ss format) - REQUIRED
- `status` (ScheduleStatus enum) - REQUIRED

### OPTIONAL FIELDS (Update)

All fields are optional in PATCH request

### BACKEND RESPONSE STRUCTURE

```typescript
{
  id: string
  laboratory_id: string
  academic_calendar_id: string
  course_name: string
  lecturer_name: string
  class_name: string
  day_of_week: number // 0-6
  start_time: Date // ISO timestamp
  end_time: Date // ISO timestamp
  status: ScheduleStatus
  created_at: Date
  updated_at: Date
  laboratory?: {
    id: string
    code: string
    name: string
  }
  academicCalendar?: {
    id: string
    academic_year: string
    semester: string
  }
}
```

### QUERY PARAMETERS (List)

- `page` (number, optional) - Page number, default 1
- `limit` (number, optional) - Items per page, default 10, MAX 100
- `search` (string, optional) - Searches course_name, lecturer_name, class_name
- `academic_calendar_id` (UUID, optional) - Filter by academic calendar
- `laboratory_id` (UUID, optional) - Filter by laboratory
- `status` (ScheduleStatus, optional) - Filter by status

### PAGINATION RESPONSE

```typescript
{
  data: ResponseScheduleDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
```

### STATUS ENUM VALUES (FROM BACKEND)

```typescript
enum ScheduleStatus {
  SCHEDULED = "SCHEDULED"
  ACTIVE = "ACTIVE"
  FINISHED = "FINISHED"
  CANCELLED = "CANCELLED"
}
```

---

## FRONTEND → BACKEND FIELD MAPPING

### ✅ DIRECT MAPPINGS (Field names/types match)

| Frontend Mock Field | Backend Field | Type | Notes |
|---|---|---|---|
| `id` | `id` | string (UUID) | Exact match |
| `laboratoryId` | `laboratory_id` | string (UUID) | Name differs, value same |
| `academicCalendarId` | `academic_calendar_id` | string (UUID) | Name differs, value same |
| `courseName` | `course_name` | string | Name differs, value same |
| `lecturerName` | `lecturer_name` | string | Name differs, value same |
| `className` | `class_name` | string | Name differs, value same |
| `status` | `status` | enum | **EXACT MATCH** - Same enum values! |

### ⚠️ TRANSFORMATION REQUIRED

| Frontend Mock Field | Backend Field | Transformation Required |
|---|---|---|
| `dayOfWeek` | `day_of_week` | Frontend: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun<br>**Backend: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat**<br>**CRITICAL**: Need conversion! |
| `startTime` (HH:mm) | `start_time` (HH:mm:ss ISO) | Frontend uses "08:00"<br>Backend expects "08:00:00" in request<br>Backend returns ISO Date in response |
| `endTime` (HH:mm) | `end_time` (HH:mm:ss ISO) | Same as start_time |
| `createdAt` | `created_at` | Frontend: localized string ("Aug 05, 2026")<br>Backend: ISO Date |
| `updatedAt` | `updated_at` | Same as createdAt |

### 🔶 DERIVED/FRONTEND-ONLY FIELDS

| Frontend Mock Field | Backend Equivalent | Notes |
|---|---|---|
| `dayName` | NOT IN BACKEND | Frontend derives from `day_of_week` |
| `laboratoryName` | `laboratory.name` | From nested relation |
| `laboratoryCode` | `laboratory.code` | From nested relation |

### ❌ BACKEND FIELDS NOT IN FRONTEND MOCK

- `laboratory` (nested object) - Contains lab details
- `academicCalendar` (nested object) - Contains calendar details

### ❌ FRONTEND MOCK FIELDS NOT IN BACKEND

None! The frontend mock structure actually aligns well with backend.

---

## CRITICAL DIFFERENCES

### 1. ⚠️ DAY OF WEEK MAPPING (CRITICAL!)

**Frontend Mock**:
```typescript
dayOfWeek: 1 // 1 = Mon, 2 = Tue, ..., 7 = Sun
```

**Backend Contract**:
```typescript
day_of_week: 1 // 0 = Sun, 1 = Mon, 2 = Tue, ..., 6 = Sat
```

**Solution**: Create conversion functions
```typescript
function frontendDayToBackend(frontendDay: number): number {
  // Frontend: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  // Backend: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  return frontendDay === 7 ? 0 : frontendDay
}

function backendDayToFrontend(backendDay: number): number {
  // Backend: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Frontend: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
  return backendDay === 0 ? 7 : backendDay
}
```

### 2. TIME FORMAT

**UI Input**: `<input type="time">` produces "HH:mm" (e.g., "08:00")
**Backend Request**: Expects "HH:mm:ss" (e.g., "08:00:00")
**Backend Response**: Returns ISO Date (e.g., "1970-01-01T08:00:00.000Z")

**Solution**: Convert on boundary
```typescript
// Request: Add ":00"
const start_time = `${form.startTime}:00`

// Response: Extract time
function extractTime(date: Date | string): string {
  const timeStr = typeof date === 'string' ? date : date.toISOString()
  return timeStr.substring(11, 16) // Extract HH:mm
}
```

### 3. LABORATORY SELECTOR

**Frontend Form**: Uses `laboratoryCode` dropdown
**Backend**: Requires `laboratory_id` (UUID)

**Solution**: Load laboratories, map code → ID
```typescript
const selectedLab = laboratories.find(l => l.code === form.laboratoryCode)
const laboratory_id = selectedLab.id
```

### 4. ACADEMIC CALENDAR SELECTOR

**Frontend Form**: Not present in mock form!
**Backend**: Requires `academic_calendar_id` (UUID)

**Solution**: Add academic calendar dropdown to form
```typescript
// Load academic calendars using existing service
const academicCalendars = await academicCalendarService.getAcademicCalendars()
```

---

## IMPLEMENTATION CHECKLIST

### Service Layer
- [ ] Create `schedule.service.ts`
- [ ] Implement day_of_week conversion (critical!)
- [ ] Implement time format conversion (HH:mm ↔ HH:mm:ss)
- [ ] Implement DTO mapping (response → UI model)
- [ ] Handle nested `laboratory` and `academicCalendar` objects

### List Page
- [ ] Replace mock data with API
- [ ] Implement pagination (backend-driven)
- [ ] Implement search (backend query param)
- [ ] Implement status filter (backend query param)
- [ ] Implement laboratory filter (backend query param)
- [ ] Display laboratory code/name from nested object

### Form Page
- [ ] **CRITICAL**: Add Academic Calendar dropdown (REQUIRED by backend)
- [ ] Load laboratories for selector
- [ ] Load academic calendars for selector
- [ ] Convert `laboratoryCode` → `laboratory_id`
- [ ] Convert day names → `day_of_week` (0-6)
- [ ] Convert HH:mm → HH:mm:ss for request
- [ ] Handle create and edit modes
- [ ] Remove or fix `dayOfWeek` mapping (frontend uses 1-7, backend uses 0-6)

### Detail Page
- [ ] Load from API instead of mock
- [ ] Display laboratory info from nested object
- [ ] Display academic calendar info if needed
- [ ] Convert day_of_week → day name for display
- [ ] Extract time from ISO date for display

---

## VALIDATION NOTES

1. **Time Validation**: Backend likely validates end_time > start_time
2. **Conflict Detection**: Backend may check for overlapping schedules (same lab, same day, overlapping times)
3. **Foreign Key Validation**: Backend validates laboratory_id and academic_calendar_id exist
4. **Day Range**: Backend validates day_of_week 0-6
5. **Status Enum**: Backend validates status is valid ScheduleStatus

---

## NEXT STEPS

1. Create `schedule.service.ts` with proper mappings
2. Update `OperationalHoursFormPage.vue` to add Academic Calendar selector
3. Fix day_of_week conversion throughout
4. Integrate list, form, and detail pages
5. Test all CRUD operations
6. Verify TypeScript compliance
7. Verify Vue template structure

