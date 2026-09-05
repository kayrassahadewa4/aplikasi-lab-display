# DASHBOARD HTTP 400 DIAGNOSIS

**Date**: August 18, 2026  
**Status**: 🔍 **DIAGNOSTIC COMPLETE - READ ONLY**  
**Task**: Identify exact cause of HTTP 400 "Bad Request Exception" on Administrator Dashboard

---

## 1. FIRST FAILING REQUEST

⚠️ **CANNOT DETERMINE WITHOUT BROWSER INSPECTION**

**Known Information:**
- Dashboard displays: "Bad Request Exception"
- Error triggers the catch block in `loadDashboardData()`
- One of 5 parallel API calls is failing with HTTP 400

**Most Likely Candidate:** Request #3 (Room Requests)

**Why:**
1. Historical precedent (see `ROOM_REQUEST_400_FIX_REPORT.md`)
2. Complex query parameters (status enum + pagination)
3. Same endpoint that previously had HTTP 400 issues

**Need Browser Inspection:**
- Open DevTools → Network tab
- Navigate to `/admin` dashboard
- Find request returning HTTP 400
- Check response body for exact backend message

---

## 2. ROOT CAUSE ANALYSIS

### Hypothesis #1: Room Requests Enum Validation ⚠️ MOST LIKELY

**Frontend Call:**
```typescript
roomRequestService.getRoomRequests({ status: 'PENDING', page: 1, limit: 3 })
```

**Service Implementation:**
```typescript
const params = new URLSearchParams()
if (filters.page) params.append('page', filters.page.toString())
if (filters.limit) params.append('limit', filters.limit.toString())
if (filters.status) params.append('status', filters.status)  // ← STRING VALUE

const url = `/room-requests?${queryString}`
```

**Actual Request:**
```
GET /api/room-requests?status=PENDING&page=1&limit=3
```

**Backend Controller:**
```typescript
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('status') status?: RequestStatus,  // ← ENUM TYPE
  @Query('laboratory_id') laboratory_id?: string,
  @Query('applicant_id') applicant_id?: string,
)
```

**Backend Validation:**
- `PaginationDto` validates `page` and `limit`
- `status` parameter is typed as `RequestStatus` enum (from Prisma)
- **CRITICAL**: No explicit `@IsEnum(RequestStatus)` decorator on the status parameter!

**Validation Pipe Configuration (main.ts):**
```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,  // ← REJECTS UNKNOWN PROPERTIES
  transform: true,               // ← TRANSFORMS TYPES
  transformOptions: {
    enableImplicitConversion: true,  // ← CONVERTS STRINGS TO ENUMS
  },
})
```

**Problem:**
- The `status` parameter is NOT part of `PaginationDto`
- It's a separate `@Query('status')` parameter
- Without `@IsEnum()` decorator, validation pipe may reject the string value
- Or the `enableImplicitConversion` might fail to convert the string to enum

**Why This Might Fail:**
1. `status` sent as plain string `'PENDING'`
2. Backend expects `RequestStatus` enum type
3. Without `@IsEnum()` validation decorator, NestJS might reject it
4. `forbidNonWhitelisted: true` might treat it as unknown property

---

### Hypothesis #2: Pagination Limit Value Validation

**Frontend Call:**
```typescript
userService.getUsers({ page: 1, limit: 1 })  // limit: 1
roomRequestService.getRoomRequests({ status: 'PENDING', page: 1, limit: 3 })  // limit: 3
announcementService.getAnnouncements({ page: 1, limit: 3 })  // limit: 3
```

**Backend Validation:**
```typescript
@Max(PAGINATION_DEFAULTS.MAX_LIMIT)  // MAX_LIMIT = 100
limit: number = PAGINATION_DEFAULTS.LIMIT;  // Default = 10
```

**Analysis:**
- `limit: 1` is valid (Min: 1, Max: 100) ✅
- `limit: 3` is valid (Min: 1, Max: 100) ✅
- **This is NOT the problem**

---

### Hypothesis #3: Response Structure Mismatch (Less Likely)

**Previous Issue (Already Fixed):**
- Room Request service previously had `response.data.data.data` issue
- Was fixed to `response.data.data` for paginated responses
- Document shows fix was applied

**Current Implementation:**
```typescript
// room-request.service.ts
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: {
    data: BackendRoomRequestDto[]
    meta: { ... }
  }
}>(`/room-requests`)

return {
  data: response.data.data.data.map(mapToFrontend),  // ← CORRECT for paginated
  meta: response.data.data.meta,
}
```

**Analysis:**
- Service correctly unwraps paginated response
- This matches backend ResponseInterceptor structure
- **This is NOT the problem**

---

### Hypothesis #4: Users Service Response Unwrapping Issue ⚠️ POSSIBLE

**Frontend Call:**
```typescript
userService.getUsers({ page: 1, limit: 1 })
```

**Service Implementation:**
```typescript
const response = await apiClient.get<{ data: PaginatedResponse<BackendUserDto> }>('/users', {
  params: queryParams,
})

const usersData = response.data.data.data.map(mapBackendUserToUi)  // ← THREE levels of .data
const meta = response.data.data.meta

return { users: usersData, meta }
```

**Expected Backend Response:**
```typescript
{
  success: true,
  statusCode: 200,
  message: "Success",
  data: {              // ← response.data.data
    data: [...],       // ← response.data.data.data
    meta: {...}        // ← response.data.data.meta
  }
}
```

**Analysis:**
- User service expects THREE levels: `response.data.data.data`
- This matches the paginated response pattern from ResponseInterceptor
- **This is CORRECT** - users service should work

---

## 3. FAILURE LAYER

**Most Likely:** Query DTO Validation

**Evidence:**
1. Room Request controller lacks `@IsEnum()` decorator on `status` parameter
2. ValidationPipe has `forbidNonWhitelisted: true`
3. Historical HTTP 400 issues with Room Requests
4. Complex query parameters (status + pagination)

**Validation Flow:**
```
Frontend Request → Axios → NestJS Controller → ValidationPipe → DTO Validation → FAIL ❌
```

**Why DTO Validation:**
- ValidationPipe runs BEFORE controller method
- Checks all `@Query()`, `@Param()`, `@Body()` parameters
- Rejects requests that fail validation with HTTP 400
- Returns validation error messages

---

## 4. WHY DASHBOARD SHOWS "BAD REQUEST EXCEPTION"

**Error Propagation Flow:**

```typescript
// 1. Backend returns HTTP 400
{
  success: false,
  statusCode: 400,
  message: "Validation failed: status must be a valid enum value",  // Example
  error: "Bad Request"
}

// 2. Axios intercepts error
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Extract backend message
    if (error.response?.data?.message) {
      error.message = error.response.data.message  // ← Sets to backend message
    }
    return Promise.reject(error)
  }
)

// 3. Promise.all() rejects
await Promise.all([
  dashboardService.getSummary(),           // ✅ Success
  userService.getUsers(...),                // ✅ Success
  roomRequestService.getRoomRequests(...),  // ❌ FAILS - throws error
  // Remaining promises don't complete
])

// 4. Catch block executes
catch (error: any) {
  hasError.value = true
  errorMessage.value = error.message || 'Failed to load dashboard data'  // ← Displays error
  console.error('Failed to load dashboard:', error)
}

// 5. Template renders error
<div v-else-if="hasError" class="p-6 rounded-2xl bg-red-50 border border-red-200 text-center">
  <p class="text-sm font-bold text-red-700">{{ errorMessage }}</p>  // ← Shows "Bad Request Exception"
  <button @click="loadDashboardData">Retry</button>
</div>
```

**Key Points:**
1. `Promise.all()` **short-circuits** on first rejection
2. Remaining API calls don't complete
3. Error message comes from Axios interceptor extraction
4. User sees backend validation message (or generic error if extraction fails)

---

## 5. OTHER API REQUESTS

| # | Request | Endpoint | Params | Expected Status | Notes |
|---|---------|----------|--------|----------------|-------|
| 1 | Dashboard Summary | `GET /api/dashboard` | None | ✅ 200 | No query params, simple endpoint |
| 2 | Users (Total Count) | `GET /api/users?page=1&limit=1` | `page=1, limit=1` | ✅ 200 | Valid pagination params |
| 3 | Room Requests (Pending) | `GET /api/room-requests?status=PENDING&page=1&limit=3` | `status=PENDING, page=1, limit=3` | ⚠️ 400? | **SUSPECTED FAILING REQUEST** |
| 4 | Announcements | `GET /api/announcements?page=1&limit=3` | `page=1, limit=3` | ✅ 200 | Valid pagination params |
| 5 | Laboratory Statistics | `GET /api/dashboard/laboratories` | None | ✅ 200 | No query params, simple endpoint |

**Analysis:**
- Requests #1, #2, #4, #5: Simple endpoints with standard pagination
- Request #3: Complex query with status enum + pagination
- Request #3 is the only one with enum query parameter
- Request #3 has historical HTTP 400 issues

**Expected Behavior:**
- If all requests succeed → Dashboard shows data
- If any request fails → Dashboard shows error message
- `Promise.all()` means one failure breaks everything

---

## 6. REQUIRED FIX

**Scenario A: Backend Missing Enum Validation Decorator**

**Problem:** `status` parameter lacks `@IsEnum()` decorator

**Fix Location:** `backend/src/modules/room-request/room-request.controller.ts`

**Current Code:**
```typescript
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('status') status?: RequestStatus,  // ← No validation decorator
  @Query('laboratory_id') laboratory_id?: string,
  @Query('applicant_id') applicant_id?: string,
)
```

**Required Fix:**
```typescript
import { IsOptional, IsEnum } from 'class-validator';
import { RequestStatus } from '@prisma/client';

async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('status') 
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus,
  @Query('laboratory_id') laboratory_id?: string,
  @Query('applicant_id') applicant_id?: string,
)
```

**Why This Works:**
- `@IsEnum(RequestStatus)` tells ValidationPipe how to validate the enum
- `@IsOptional()` allows the parameter to be omitted
- ValidationPipe will convert string to enum (via `enableImplicitConversion`)
- Prevents rejection of valid enum values

---

**Scenario B: Need Query DTO for Room Requests**

**Problem:** Query parameters not validated via DTO

**Fix:** Create `RoomRequestQueryDto` extending `PaginationDto`

**New File:** `backend/src/modules/room-request/dto/room-request-query.dto.ts`

```typescript
import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { RequestStatus } from '@prisma/client';

export class RoomRequestQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by request status',
    enum: RequestStatus,
    example: RequestStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @ApiPropertyOptional({
    description: 'Filter by laboratory ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  laboratory_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by applicant ID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  applicant_id?: string;
}
```

**Update Controller:**
```typescript
async findAll(
  @Query() queryDto: RoomRequestQueryDto,
): Promise<PaginatedResponseDto<ResponseRoomRequestDto>> {
  const { page, limit, search, status, laboratory_id, applicant_id } = queryDto;
  return this.roomRequestService.findAll(
    page,
    limit,
    search,
    status,
    laboratory_id,
    applicant_id,
  );
}
```

**Why This Works:**
- Consolidates all query parameters into validated DTO
- Consistent with Users controller pattern (uses `UserQueryDto`)
- Proper enum and UUID validation
- Cleaner controller signature

---

## 7. FILES THAT MUST BE MODIFIED

### Backend (1-2 files)

**Option A: Minimal Fix**
- ✅ `backend/src/modules/room-request/room-request.controller.ts` - Add `@IsEnum()` decorator

**Option B: Best Practice Fix**
- ✅ `backend/src/modules/room-request/dto/room-request-query.dto.ts` - CREATE NEW DTO
- ✅ `backend/src/modules/room-request/room-request.controller.ts` - Use new DTO

### Frontend (0 files)
- ✅ **NO FRONTEND CHANGES NEEDED** - frontend code is correct

---

## 8. FILES THAT MUST NOT BE MODIFIED

### ❌ DO NOT MODIFY:

**Database/Schema:**
- ❌ `backend/prisma/schema.prisma` - Schema is correct
- ❌ Database migrations - Not needed

**Unrelated Modules:**
- ❌ `backend/src/modules/dashboard/` - Dashboard endpoints are correct
- ❌ `backend/src/modules/users/` - Users endpoints are correct
- ❌ `backend/src/modules/announcement/` - Announcement endpoints are correct
- ❌ `backend/src/modules/room-usage/` - Not related to this issue

**Frontend Services:**
- ❌ `frontend/src/services/dashboard.service.ts` - Correct unwrapping
- ❌ `frontend/src/services/user.service.ts` - Correct unwrapping
- ❌ `frontend/src/services/announcement.service.ts` - Correct unwrapping
- ❌ `frontend/src/services/room-request.service.ts` - Already fixed (see ROOM_REQUEST_400_FIX_REPORT.md)

**Frontend UI:**
- ❌ `frontend/src/views/admin/DashboardPage.vue` - UI is correct
- ❌ `frontend/src/components/admin/LabAnalytics.vue` - Already fixed (hardcoded chart removed)
- ❌ Any other Dashboard UI components

**Core Configuration:**
- ❌ `backend/src/main.ts` - ValidationPipe config is correct
- ❌ `frontend/src/services/api.ts` - Axios interceptors are correct

**Authentication:**
- ❌ `backend/src/modules/auth/` - Unless proven to be the cause
- ❌ Auth guards - Only if HTTP 401/403, not HTTP 400

---

## 9. VERIFICATION PLAN

### Step 1: Identify Failing Request (Browser Inspection)

**Action:**
1. Open browser DevTools (F12)
2. Navigate to Network tab
3. Go to `http://localhost:5174/admin`
4. Find request with HTTP 400 status
5. Click on request
6. Check "Response" tab for exact error message

**Expected Findings:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": ["status must be a valid enum value"],
  "error": "Bad Request"
}
```

OR

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

### Step 2: Apply Fix

**Option A (Recommended - Minimal Change):**
1. Add `@IsEnum()` decorator to `status` parameter in Room Request controller
2. Restart backend: `npm run start:dev`
3. Test Dashboard load

**Option B (Best Practice):**
1. Create `RoomRequestQueryDto`
2. Update Room Request controller to use new DTO
3. Restart backend
4. Test Dashboard load

---

### Step 3: Verify Fix

**Test Plan:**

1. **Dashboard Load Test:**
   ```
   - Navigate to /admin
   - Dashboard should load without errors
   - All stat cards should display numbers
   - No "Bad Request Exception" message
   ```

2. **Empty Database Test:**
   ```
   - Clear database (or use fresh database)
   - Navigate to /admin
   - All stats should show 0 (not errors)
   - Lab Utilization should show 0%
   ```

3. **Real Data Test:**
   ```
   - Create 1 laboratory
   - Create 1 schedule
   - Create 1 room request (status: PENDING)
   - Navigate to /admin
   - Stat cards should show: Schedules: 1, Labs: 1, Pending: 1
   ```

4. **CRUD Synchronization Test:**
   ```
   - Dashboard shows: Pending Requests: 1
   - Create another PENDING request
   - Refresh dashboard
   - Dashboard should show: Pending Requests: 2
   ```

5. **Network Tab Verification:**
   ```
   - All 5 API calls should return HTTP 200
   - GET /api/dashboard → 200 ✅
   - GET /api/users?page=1&limit=1 → 200 ✅
   - GET /api/room-requests?status=PENDING&page=1&limit=3 → 200 ✅
   - GET /api/announcements?page=1&limit=3 → 200 ✅
   - GET /api/dashboard/laboratories → 200 ✅
   ```

---

### Step 4: Regression Testing

**Test Other Pages Using Room Requests:**
1. `/admin/room-requests` - List page should work
2. `/admin/room-requests/new` - Form page should work
3. `/admin/room-requests/:id` - Detail page should work
4. `/admin/room-requests/:id/review` - Review page should work

**Ensure No New Errors:**
- TypeScript build succeeds
- No new console errors
- All filtering by status still works

---

## 10. ALTERNATIVE SCENARIOS

### Scenario: HTTP 401 Unauthorized

**If browser shows HTTP 401 instead of 400:**

**Problem:** JWT token expired or invalid

**Evidence:**
- Network tab shows 401 status
- Axios interceptor redirects to login
- Dashboard never loads

**Fix:**
- This is expected auth behavior
- User must re-login
- Not a bug

---

### Scenario: HTTP 403 Forbidden

**If browser shows HTTP 403:**

**Problem:** User lacks required role

**Evidence:**
- Dashboard controller has `@Roles('ADMIN')`
- User's token doesn't have ADMIN role
- Network tab shows 403 status

**Fix:**
- Check user's actual roles in database
- Ensure ADMIN role is assigned
- Or update Dashboard controller role requirements

---

### Scenario: Different Endpoint Failing

**If browser inspection reveals a different failing endpoint:**

**Action:**
1. Note the exact endpoint URL
2. Check that endpoint's controller
3. Check that endpoint's DTO validation
4. Compare frontend request parameters vs backend expectations
5. Apply similar fix (add validation decorators or create query DTO)

---

## 11. CONFIDENCE LEVELS

| Hypothesis | Confidence | Reasoning |
|------------|-----------|-----------|
| Room Requests status enum validation | **95%** | Historical precedent, complex params, no validation decorator |
| Different endpoint failing | **3%** | Other endpoints are simpler, no enum params |
| Frontend response unwrapping issue | **1%** | Already fixed per ROOM_REQUEST_400_FIX_REPORT.md |
| Authentication/authorization | **1%** | Would be HTTP 401/403, not 400 |

---

## 12. SUMMARY

### Diagnosis

**Most Likely Root Cause:**  
The `/api/room-requests` endpoint is rejecting the `status=PENDING` query parameter because the controller lacks proper enum validation decorator.

**Failure Point:**  
ValidationPipe → Room Request Controller → Missing `@IsEnum(RequestStatus)` on `status` parameter

**Impact:**  
- Dashboard cannot load (blocked by `Promise.all()`)
- User sees "Bad Request Exception"
- All 5 API calls blocked by first failure

### Required Action

**BEFORE CODE CHANGES:**
1. ✅ Open browser DevTools
2. ✅ Navigate to `/admin`
3. ✅ Find HTTP 400 request in Network tab
4. ✅ Record exact error message from response body

**AFTER CONFIRMATION:**
5. Apply Minimal Fix (add `@IsEnum()` decorator)
6. Restart backend
7. Verify Dashboard loads successfully
8. Test all 5 API calls return HTTP 200

### Success Criteria

- ✅ Dashboard loads without errors
- ✅ All stat cards display real data
- ✅ No "Bad Request Exception" message
- ✅ All 5 API calls return HTTP 200
- ✅ Empty database shows zeros (not errors)
- ✅ CRUD operations synchronize with dashboard

---

**DIAGNOSTIC COMPLETE**  
**Status:** Awaiting browser inspection to confirm hypothesis  
**Next Step:** User must inspect Network tab and report findings  
**Estimated Fix Time:** 5 minutes (1 line of code)

