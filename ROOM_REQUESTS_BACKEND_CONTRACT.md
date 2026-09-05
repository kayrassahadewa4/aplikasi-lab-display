# Room Requests Backend API Contract

**Document Version:** 1.0  
**Created:** 2026-08-15  
**Purpose:** Complete mapping between frontend UI fields and backend API contract for Room Request module integration

---

## 1. BACKEND DTO STRUCTURE

### CreateRoomRequestDto (Backend Input)
```typescript
{
  applicant_id: string          // UUID - REQUIRED
  laboratory_id: string         // UUID - REQUIRED
  activity_name: string         // REQUIRED
  course_name?: string          // OPTIONAL
  class_name?: string           // OPTIONAL
  description: string           // REQUIRED
  request_date: Date            // PostgreSQL Date - REQUIRED
  start_time: string            // HH:mm:ss format - REQUIRED
  end_time: string              // HH:mm:ss format - REQUIRED
  participant_count: number     // REQUIRED
  status: string                // "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" - REQUIRED
}
```

### UpdateRoomRequestDto (Backend Input)
```typescript
{
  // All fields from Create DTO PLUS:
  approved_by?: string          // UUID - OPTIONAL (set when approving)
  rejection_reason?: string     // OPTIONAL (required when rejecting)
}
```

### ResponseRoomRequestDto (Backend Output)
```typescript
{
  id: string                    // UUID
  applicant_id: string          // UUID
  laboratory_id: string         // UUID
  approved_by: string | null    // UUID or null
  activity_name: string
  course_name: string | null
  class_name: string | null
  description: string
  request_date: Date            // ISO 8601 Date string in response
  start_time: Date              // ISO 8601 DateTime string (TIME(6) serialized as Date)
  end_time: Date                // ISO 8601 DateTime string (TIME(6) serialized as Date)
  participant_count: number
  status: string                // "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED"
  rejection_reason: string | null
  
  // Nested relations:
  applicant: {                  // UserInfoDto
    id: string
    full_name: string
    email: string
    roles: string[]
  }
  
  approver: {                   // UserInfoDto | null
    id: string
    full_name: string
    email: string
    roles: string[]
  } | null
  
  laboratory: {                 // LaboratoryInfoDto
    id: string
    name: string
    code: string
    room_number: string
    building: string
    floor_number: number
    capacity: number
    type: string
    is_available: boolean
  }
  
  created_at: Date              // ISO 8601 DateTime
  updated_at: Date              // ISO 8601 DateTime
}
```

---

## 2. FRONTEND MOCK DATA STRUCTURE (CURRENT)

### Admin Mock Data Fields
```typescript
{
  id: string                    // "req-00123"
  applicantId: string
  applicantName: string         // DERIVED from applicant.full_name
  applicantEmail: string        // DERIVED from applicant.email
  applicantRole: string         // DERIVED from applicant.roles[0]
  
  laboratoryId: string
  laboratoryName: string        // DERIVED from laboratory.name
  laboratoryCode: string        // DERIVED from laboratory.code
  
  approvedBy: string | null
  approverName: string | null   // DERIVED from approver.full_name
  
  activityName: string          // MAPS to activity_name
  courseName: string            // MAPS to course_name
  className: string             // MAPS to class_name
  description: string           // MAPS to description
  
  requestDate: string           // "2026-08-20" - MAPS to request_date
  formattedRequestDate: string  // "Wed, Aug 20, 2026" - FRONTEND FORMATTING ONLY
  startTime: string             // "08:00" - EXTRACT from start_time
  endTime: string               // "10:00" - EXTRACT from end_time
  participantCount: number      // MAPS to participant_count
  
  status: string                // MAPS to status
  rejectionReason: string | null // MAPS to rejection_reason
  approvedAt: string | null     // DERIVED from updated_at (if approved)
  
  createdAt: string             // DERIVED from created_at
  updatedAt: string             // DERIVED from updated_at
}
```

### Lecturer Mock Data Fields (Slightly Different)
```typescript
{
  id: string                    // "lreq-00124"
  requestCode: string           // "REQ-00124" - FRONTEND ONLY (display format)
  
  labId: string                 // MAPS to laboratory_id
  labName: string               // DERIVED from laboratory.name
  labCode: string               // DERIVED from laboratory.code
  
  activityName: string          // MAPS to activity_name
  courseName: string            // MAPS to course_name
  courseCode: string            // FRONTEND ONLY (not in backend)
  targetClass: string           // MAPS to class_name
  studentCount: number          // MAPS to participant_count
  
  requestedDate: string         // "2026-08-20" - MAPS to request_date
  formattedDate: string         // "Wed, Aug 20, 2026" - FRONTEND FORMATTING
  timeSlot: string              // "13:00 - 15:00" - DERIVED from start_time + end_time
  
  purpose: string               // MAPS to description
  status: string                // MAPS to status
  
  submittedAt: string           // DERIVED from created_at
  updatedAt: string             // DERIVED from updated_at
  reviewedAt: string | null     // DERIVED from updated_at (if reviewed)
  reviewedBy: string | null     // DERIVED from approver.full_name
  
  approvalNote: string | null   // FRONTEND ONLY (not in backend)
  relatedScheduleId: string | null // FRONTEND ONLY (not in backend)
}
```

---

## 3. CRITICAL FIELD MAPPINGS

### DATE & TIME HANDLING

**Backend Request Date:**
- Field: `request_date`
- Type: PostgreSQL `Date`
- Format for CREATE: `YYYY-MM-DD` string (ISO 8601 date portion)
- Format in RESPONSE: ISO 8601 Date string `"2026-08-20T00:00:00.000Z"` or `"2026-08-20"`

**Backend Time Fields:**
- Fields: `start_time`, `end_time`
- Type: PostgreSQL `TIME(6)`
- Format for CREATE: `HH:mm:ss` (e.g., `"08:00:00"`)
- Format in RESPONSE: ISO 8601 DateTime string (e.g., `"1970-01-01T08:00:00.000Z"`)
- **EXTRACTION RULE:** Parse the time portion only (`HH:mm` or `HH:mm:ss`)

**Frontend Input:**
- Date input: `<input type="date">` produces `YYYY-MM-DD`
- Time input: `<input type="time">` produces `HH:mm`
- Time select: `<select>` produces `HH:mm`

**Service Layer Conversions:**
```typescript
// CREATE REQUEST:
// Frontend "08:00" → Backend "08:00:00"
const toBackendTime = (timeStr: string): string => {
  if (timeStr.length === 5) return `${timeStr}:00` // "08:00" → "08:00:00"
  return timeStr
}

// RESPONSE:
// Backend "1970-01-01T08:00:00.000Z" → Frontend "08:00"
const fromBackendTime = (isoDateTime: string): string => {
  const date = new Date(isoDateTime)
  return date.toISOString().substr(11, 5) // Extract "HH:mm"
}

// Date is straightforward - use YYYY-MM-DD format
const toBackendDate = (dateStr: string): string => dateStr // "2026-08-20"
const fromBackendDate = (isoDate: string): string => {
  return isoDate.split('T')[0] // "2026-08-20T00:00:00.000Z" → "2026-08-20"
}
```

### DERIVED FRONTEND-ONLY FIELDS

**Fields NOT in Backend (Must be Derived/Generated):**
1. `applicantName` → from `applicant.full_name`
2. `applicantEmail` → from `applicant.email`
3. `applicantRole` → from `applicant.roles[0]` (use first role, uppercase)
4. `laboratoryName` → from `laboratory.name`
5. `laboratoryCode` → from `laboratory.code`
6. `approverName` → from `approver?.full_name`
7. `formattedRequestDate` / `formattedDate` → format `request_date` to locale string
8. `timeSlot` → combine `"${start_time} - ${end_time}"`
9. `requestCode` → format ID to display format (e.g., `"REQ-00124"`)
10. `courseCode` → NOT in backend, use `course_name` or leave empty
11. `approvalNote` → NOT in backend (feature not implemented yet)
12. `relatedScheduleId` → NOT in backend (feature not implemented yet)

---

## 4. API ENDPOINTS

**Base URL:** `/api/v1/room-requests`

### 4.1 List Room Requests (Paginated)
```
GET /api/v1/room-requests
Query Params:
  - page?: number (default: 1)
  - limit?: number (default: 10)
  - search?: string (searches activity_name, description)
  - status?: string (filter by status)
  - laboratory_id?: string (filter by lab UUID)
  - applicant_id?: string (filter by applicant UUID)
  - sort_by?: string (default: "created_at")
  - sort_order?: "asc" | "desc" (default: "desc")

Response: {
  data: ResponseRoomRequestDto[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### 4.2 Get Single Room Request
```
GET /api/v1/room-requests/:id
Response: ResponseRoomRequestDto
```

### 4.3 Create Room Request
```
POST /api/v1/room-requests
Body: CreateRoomRequestDto
Response: ResponseRoomRequestDto
```

### 4.4 Update Room Request
```
PATCH /api/v1/room-requests/:id
Body: UpdateRoomRequestDto (partial)
Response: ResponseRoomRequestDto
```

### 4.5 Delete Room Request
```
DELETE /api/v1/room-requests/:id
Response: { message: string }
```

---

## 5. VALIDATION RULES (Backend Service)

**12 Validation Rules Implemented:**
1. Time validation: `start_time < end_time` (midnight 00:00 is valid end time)
2. Operational hours check: Request must fall within laboratory's operational hours for the day
3. Academic calendar check: `request_date` must fall within an ACTIVE academic calendar period
4. Duplicate check: Same applicant cannot request same lab, date, and overlapping time
5. Conflict with approved requests: Cannot overlap with other APPROVED room requests for the lab
6. Conflict with schedules: Cannot overlap with regular schedules for the lab on that day
7. Status transitions: PENDING → APPROVED/REJECTED/CANCELLED only
8. Approved request immutability: Cannot edit after approval
9. Participant count: Must be positive and within lab capacity
10. Laboratory availability: `is_available` must be true
11. Update approval fields: Can only set `approved_by` when status = APPROVED
12. Delete restriction: Cannot delete if room usages exist

---

## 6. AUTHORIZATION RULES

**Role-based Access:**
- **DOSEN (Lecturer):**
  - Can CREATE room requests (applicant_id auto-derived from auth)
  - Can UPDATE own requests (only if PENDING)
  - Can DELETE own requests (only if PENDING)
  - Can READ own requests
  
- **ADMIN:**
  - Can CREATE room requests (can specify any applicant_id)
  - Can UPDATE any request (including approval workflow)
  - Can DELETE any request
  - Can READ all requests
  
- **LABORAN:**
  - Can READ all requests
  - Cannot create/update/delete (read-only access)

---

## 7. SERVICE INTERFACE DESIGN

```typescript
interface IRoomRequestService {
  // List with filters and pagination
  getRoomRequests(params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    laboratoryId?: string
    applicantId?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<RoomRequest>>
  
  // Single request
  getRoomRequestById(id: string): Promise<RoomRequest>
  
  // Create
  createRoomRequest(data: CreateRoomRequestPayload): Promise<RoomRequest>
  
  // Update (partial)
  updateRoomRequest(id: string, data: UpdateRoomRequestPayload): Promise<RoomRequest>
  
  // Delete
  deleteRoomRequest(id: string): Promise<void>
  
  // SPECIAL: Approve request (sugar method)
  approveRoomRequest(id: string, approvedBy: string): Promise<RoomRequest>
  
  // SPECIAL: Reject request (sugar method)
  rejectRoomRequest(id: string, reason: string): Promise<RoomRequest>
}
```

---

## 8. INTEGRATION CHECKLIST

**Pages to Integrate:**
- [x] Admin: RoomRequestsPage.vue (list)
- [x] Admin: RoomRequestFormPage.vue (create/edit)
- [x] Admin: RoomRequestDetailPage.vue (view)
- [x] Admin: RoomRequestReviewPage.vue (approve/reject workflow)
- [x] Lecturer: RoomRequestsPage.vue (list - own requests)
- [x] Lecturer: NewRoomRequestPage.vue (create - auto applicant_id)
- [x] Lecturer: RoomRequestDetailPage.vue (view own)
- [x] Laboran: RoomRequestsPage.vue (list - read only)
- [x] Laboran: RoomRequestDetailPage.vue (view - read only)

**Key Integration Points:**
1. Replace mockRoomRequestsList with API calls
2. Handle applicant_id derivation for lecturer role (from auth context)
3. Implement date/time conversions in service layer
4. Map nested relations to flat UI fields
5. Handle pagination state sync with API
6. Implement search/filter query building
7. Add loading/error states
8. Preserve existing UI/UX design

---

**END OF CONTRACT DOCUMENT**
