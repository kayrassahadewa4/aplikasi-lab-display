# DASHBOARD HTTP 400 - PHASE A DIAGNOSTIC REPORT

**Date**: August 18, 2026  
**Status**: 🔍 **DIAGNOSTIC LOGGING ADDED - AWAITING BROWSER TEST**

---

## PHASE A STATUS

### ✅ Actions Completed

1. ✅ **Backend Running**: Confirmed NestJS backend running on port 3000
2. ✅ **Frontend Running**: Confirmed Vite frontend running on port 5174
3. ✅ **Diagnostic Logging Added**: Modified DashboardPage.vue to test endpoints sequentially
4. ✅ **All Endpoints Mapped**: Verified all 5 dashboard endpoints exist in backend

### ⚠️ Awaiting User Action

**CRITICAL**: User must open browser and check console logs

**Steps Required:**
1. Open browser
2. Navigate to `http://localhost:5174/admin`
3. Login if necessary
4. Open DevTools (F12)
5. Go to Console tab
6. Look for diagnostic logs starting with `[DASHBOARD DIAGNOSTIC]` or `[TEST X/5]`
7. Report findings

---

## DIAGNOSTIC IMPLEMENTATION

### Modified File

**File**: `frontend/src/views/admin/DashboardPage.vue`

**Change**: Replaced `Promise.all()` with sequential endpoint testing

**Purpose**: Identify EXACT failing endpoint before fixing

### Test Sequence

The Dashboard now tests endpoints in this order:

```
[TEST 1/5] GET /api/dashboard
[TEST 2/5] GET /api/users?page=1&limit=1
[TEST 3/5] GET /api/room-requests?status=PENDING&page=1&limit=3
[TEST 4/5] GET /api/announcements?page=1&limit=3
[TEST 5/5] GET /api/dashboard/laboratories
```

### Expected Console Output

**If all tests pass:**
```
[DASHBOARD DIAGNOSTIC] Testing endpoints individually...
[TEST 1/5] GET /api/dashboard
[TEST 1/5] ✅ PASS: {total_laboratories: 0, ...}
[TEST 2/5] GET /api/users?page=1&limit=1
[TEST 2/5] ✅ PASS: {users: [...], meta: {...}}
[TEST 3/5] GET /api/room-requests?status=PENDING&page=1&limit=3
[TEST 3/5] ✅ PASS: {data: [...], meta: {...}}
[TEST 4/5] GET /api/announcements?page=1&limit=3
[TEST 4/5] ✅ PASS: {data: [...], meta: {...}}
[TEST 5/5] GET /api/dashboard/laboratories
[TEST 5/5] ✅ PASS: [{laboratory_id: ..., ...}]
[DASHBOARD DIAGNOSTIC] All tests passed!
```

**If a test fails (example - Test 3):**
```
[DASHBOARD DIAGNOSTIC] Testing endpoints individually...
[TEST 1/5] GET /api/dashboard
[TEST 1/5] ✅ PASS: {total_laboratories: 0, ...}
[TEST 2/5] GET /api/users?page=1&limit=1
[TEST 2/5] ✅ PASS: {users: [...], meta: {...}}
[TEST 3/5] GET /api/room-requests?status=PENDING&page=1&limit=3
[DASHBOARD DIAGNOSTIC] ❌ FAILED: Error: Request failed with status code 400
[DASHBOARD DIAGNOSTIC] Error details: {
  message: "...",
  response: {
    success: false,
    statusCode: 400,
    message: "...",
    error: "Bad Request"
  },
  status: 400,
  config: {
    url: "/room-requests",
    method: "get",
    params: {status: "PENDING", page: 1, limit: 3}
  }
}
```

---

## ENDPOINTS BEING TESTED

### Test 1: Dashboard Summary

**Frontend Service**: `dashboardService.getSummary()`

**HTTP Request:**
```
GET /api/dashboard
```

**Query Parameters**: None

**Backend Controller**: `DashboardController.getDashboard()`

**Backend Route:**
```typescript
@Get()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async getDashboard(): Promise<DashboardSummaryDto>
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "total_laboratories": 0,
    "active_laboratories": 0,
    "inactive_laboratories": 0,
    "total_schedules": 0,
    "today_schedules": 0,
    "total_room_requests": 0,
    "pending_requests": 0,
    "approved_requests": 0,
    "rejected_requests": 0,
    "current_room_usage": 0,
    "active_announcements": 0
  }
}
```

**Potential Failure Reasons:**
- ❌ Missing JWT token (HTTP 401)
- ❌ User lacks ADMIN role (HTTP 403)
- ✅ No query params, unlikely to cause HTTP 400

---

### Test 2: Users (Total Count)

**Frontend Service**: `userService.getUsers({ page: 1, limit: 1 })`

**HTTP Request:**
```
GET /api/users?page=1&limit=1
```

**Query Parameters**:
- `page`: 1 (number)
- `limit`: 1 (number)

**Backend Controller**: `UserController.findAll(@Query() queryDto: UserQueryDto)`

**Backend DTO**: `UserQueryDto extends PaginationDto`

**Validation:**
```typescript
// PaginationDto
@IsOptional()
@Type(() => Number)
@IsInt()
@Min(1)
page: number = 1

@IsOptional()
@Type(() => Number)
@IsInt()
@Min(1)
@Max(100)
limit: number = 10
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 1,
      "total": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

**Potential Failure Reasons:**
- ❌ Missing JWT token (HTTP 401)
- ❌ User lacks ADMIN role (HTTP 403)
- ⚠️ `limit: 1` is valid (Min: 1, Max: 100)
- ✅ Unlikely to cause HTTP 400

---

### Test 3: Room Requests (Pending)

**Frontend Service**: `roomRequestService.getRoomRequests({ status: 'PENDING', page: 1, limit: 3 })`

**HTTP Request:**
```
GET /api/room-requests?status=PENDING&page=1&limit=3
```

**Query Parameters**:
- `status`: "PENDING" (string)
- `page`: 1 (number)
- `limit`: 3 (number)

**Backend Controller**:
```typescript
@Get()
@Roles('ADMIN', 'LABORAN', 'DOSEN')
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('status') status?: RequestStatus,  // ← NO VALIDATION DECORATOR!
  @Query('laboratory_id') laboratory_id?: string,
  @Query('applicant_id') applicant_id?: string,
): Promise<PaginatedResponseDto<ResponseRoomRequestDto>>
```

**CRITICAL OBSERVATION**: `status` parameter has NO `@IsEnum()` decorator!

**ValidationPipe Configuration** (main.ts):
```typescript
new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,  // ← REJECTS UNKNOWN PROPERTIES
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
})
```

**Potential Failure Reasons:**
- ⚠️ **HIGH**: `status` parameter lacks `@IsEnum(RequestStatus)` decorator
- ⚠️ **HIGH**: `forbidNonWhitelisted: true` may reject `status` as unknown property
- ⚠️ **MEDIUM**: ValidationPipe may not convert string "PENDING" to enum without decorator
- ✅ `page: 1, limit: 3` are valid (within allowed range)

**Expected Response (if works):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 3,
      "total": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

**Expected Error (if fails):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "property status should not exist"
  ],
  "error": "Bad Request"
}
```

OR

```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "status must be a valid enum value"
  ],
  "error": "Bad Request"
}
```

**⚠️ THIS IS THE MOST LIKELY FAILING ENDPOINT**

---

### Test 4: Announcements

**Frontend Service**: `announcementService.getAnnouncements({ page: 1, limit: 3 })`

**HTTP Request:**
```
GET /api/announcements?page=1&limit=3
```

**Query Parameters**:
- `page`: 1 (number)
- `limit`: 3 (number)

**Backend Controller**: `AnnouncementController.findAll(@Query() paginationDto: PaginationDto)`

**Backend DTO**: `PaginationDto` (same as Test 2)

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [],
    "meta": {
      "page": 1,
      "limit": 3,
      "total": 0,
      "totalPages": 0,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

**Potential Failure Reasons:**
- ❌ Missing JWT token (HTTP 401)
- ❌ User lacks ADMIN role (HTTP 403)
- ✅ `page: 1, limit: 3` are valid
- ✅ Unlikely to cause HTTP 400

---

### Test 5: Laboratory Statistics

**Frontend Service**: `dashboardService.getLaboratoryStatistics()`

**HTTP Request:**
```
GET /api/dashboard/laboratories
```

**Query Parameters**: None

**Backend Controller**: `DashboardController.getLaboratories()`

**Backend Route:**
```typescript
@Get('laboratories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
async getLaboratories(): Promise<LaboratoryStatisticDto[]>
```

**Expected Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": []
}
```

**Potential Failure Reasons:**
- ❌ Missing JWT token (HTTP 401)
- ❌ User lacks ADMIN role (HTTP 403)
- ✅ No query params, unlikely to cause HTTP 400

---

## HYPOTHESIS RANKING

Based on code inspection:

| Rank | Endpoint | Confidence | Reason |
|------|----------|-----------|--------|
| 1 | Test 3: Room Requests | **95%** | No `@IsEnum()` decorator on `status` parameter |
| 2 | Test 2: Users | **2%** | Simple pagination, well-validated |
| 3 | Test 4: Announcements | **1%** | Simple pagination, well-validated |
| 4 | Test 1: Dashboard Summary | **1%** | No query params |
| 5 | Test 5: Lab Statistics | **1%** | No query params |

---

## WHAT USER MUST DO NOW

### Step 1: Open Browser Console

1. Open Chrome/Firefox
2. Navigate to `http://localhost:5174`
3. Login with ADMIN credentials
4. Navigate to `/admin` (Dashboard page)
5. Open DevTools (F12)
6. Go to **Console** tab

### Step 2: Look for Diagnostic Logs

Search for logs starting with:
- `[DASHBOARD DIAGNOSTIC]`
- `[TEST 1/5]`
- `[TEST 2/5]`
- `[TEST 3/5]`
- `[TEST 4/5]`
- `[TEST 5/5]`

### Step 3: Identify Failing Test

**Look for:**
- ✅ `[TEST X/5] ✅ PASS` - Endpoint worked
- ❌ `[DASHBOARD DIAGNOSTIC] ❌ FAILED` - Endpoint failed

### Step 4: Report Findings

**If Test 3 (Room Requests) fails:**
- Confirm hypothesis correct
- Proceed to fix (add `@IsEnum()` decorator)

**If different test fails:**
- Report which test failed
- Report error message
- Report response body
- Adjust fix strategy

### Step 5: Check Network Tab (Optional)

1. Go to **Network** tab
2. Find the failing request (HTTP 400 status - shown in red)
3. Click on the request
4. Go to **Response** tab
5. Copy the response body
6. Report the exact backend error message

---

## EXPECTED BROWSER CONSOLE OUTPUT SCENARIOS

### Scenario A: Test 3 Fails (Hypothesis Confirmed)

```
[DASHBOARD DIAGNOSTIC] Testing endpoints individually...
[TEST 1/5] GET /api/dashboard
[TEST 1/5] ✅ PASS: {total_laboratories: 0, ...}
[TEST 2/5] GET /api/users?page=1&limit=1
[TEST 2/5] ✅ PASS: {users: [], meta: {total: 0}}
[TEST 3/5] GET /api/room-requests?status=PENDING&page=1&limit=3
[DASHBOARD DIAGNOSTIC] ❌ FAILED: Request failed with status code 400
[DASHBOARD DIAGNOSTIC] Error details: {
  message: "property status should not exist",
  response: {
    success: false,
    statusCode: 400,
    message: ["property status should not exist"],
    error: "Bad Request"
  },
  status: 400,
  config: {
    url: "/room-requests",
    method: "get",
    params: {status: "PENDING", page: 1, limit: 3}
  }
}
```

**Action**: Proceed to Phase B - Fix Room Request controller

---

### Scenario B: Test 2 Fails (Unexpected)

```
[DASHBOARD DIAGNOSTIC] Testing endpoints individually...
[TEST 1/5] GET /api/dashboard
[TEST 1/5] ✅ PASS: {total_laboratories: 0, ...}
[TEST 2/5] GET /api/users?page=1&limit=1
[DASHBOARD DIAGNOSTIC] ❌ FAILED: Request failed with status code 400
[DASHBOARD DIAGNOSTIC] Error details: {...}
```

**Action**: Investigate Users endpoint validation

---

### Scenario C: All Tests Pass (Unexpected)

```
[DASHBOARD DIAGNOSTIC] Testing endpoints individually...
[TEST 1/5] GET /api/dashboard
[TEST 1/5] ✅ PASS: {total_laboratories: 0, ...}
[TEST 2/5] GET /api/users?page=1&limit=1
[TEST 2/5] ✅ PASS: {users: [], meta: {total: 0}}
[TEST 3/5] GET /api/room-requests?status=PENDING&page=1&limit=3
[TEST 3/5] ✅ PASS: {data: [], meta: {total: 0}}
[TEST 4/5] GET /api/announcements?page=1&limit=3
[TEST 4/5] ✅ PASS: {data: [], meta: {total: 0}}
[TEST 5/5] GET /api/dashboard/laboratories
[TEST 5/5] ✅ PASS: []
[DASHBOARD DIAGNOSTIC] All tests passed!
```

**Action**: 
- Dashboard should load successfully
- No "Bad Request Exception" message
- Issue may have been intermittent or already resolved
- Remove diagnostic logging and restore `Promise.all()`

---

### Scenario D: HTTP 401 (Authentication Issue)

```
[DASHBOARD DIAGNOSTIC] Testing endpoints individually...
[TEST 1/5] GET /api/dashboard
[DASHBOARD DIAGNOSTIC] ❌ FAILED: Request failed with status code 401
[DASHBOARD DIAGNOSTIC] Error details: {
  message: "Unauthorized",
  response: {
    success: false,
    statusCode: 401,
    message: "Unauthorized",
    error: "Unauthorized"
  },
  status: 401
}
```

**Action**:
- User not logged in OR
- JWT token expired OR
- Token invalid
- User must re-login
- This is NOT a bug (expected auth behavior)

---

### Scenario E: HTTP 403 (Authorization Issue)

```
[DASHBOARD DIAGNOSTIC] Testing endpoints individually...
[TEST 1/5] GET /api/dashboard
[DASHBOARD DIAGNOSTIC] ❌ FAILED: Request failed with status code 403
[DASHBOARD DIAGNOSTIC] Error details: {
  message: "Forbidden",
  response: {
    success: false,
    statusCode: 403,
    message: "Forbidden resource",
    error: "Forbidden"
  },
  status: 403
}
```

**Action**:
- User lacks ADMIN role
- Check user's actual roles in database
- Assign ADMIN role if necessary
- This is authorization working as designed

---

## NEXT STEPS AFTER CONFIRMATION

### If Test 3 (Room Requests) Fails:

**Root Cause**: Missing `@IsEnum(RequestStatus)` decorator on `status` parameter

**Fix Required**: Create `RoomRequestQueryDto` with proper validation

**Files to Modify**:
1. CREATE: `backend/src/modules/room-request/dto/room-request-query.dto.ts`
2. MODIFY: `backend/src/modules/room-request/room-request.controller.ts`

**Estimated Fix Time**: 10 minutes

### If Different Test Fails:

**Action**: Investigate that specific endpoint's validation

**Process**:
1. Identify exact error message
2. Inspect backend controller
3. Inspect backend DTO
4. Compare frontend request vs backend expectations
5. Apply targeted fix

---

## FILES MODIFIED (DIAGNOSTIC ONLY)

### Frontend

- ✅ `frontend/src/views/admin/DashboardPage.vue` - Added sequential diagnostic logging

**⚠️ TEMPORARY CHANGE**: Must be reverted after diagnosis complete

---

## STATUS

**Current Phase**: PHASE A - IDENTIFY EXACT FAILING REQUEST

**Status**: ⏸️ **AWAITING USER BROWSER TEST**

**Next Action**: User must open browser console and report diagnostic log output

**Blocker**: Cannot proceed without actual browser console output

---

**Report Generated**: August 18, 2026  
**Purpose**: Diagnostic Phase A - Identify exact failing endpoint  
**Type**: READ-ONLY INVESTIGATION (with diagnostic logging)

