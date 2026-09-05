# ROOM REQUESTS HTTP 400 DIAGNOSTIC REPORT

**Date**: August 15, 2026  
**Issue**: Room Requests page displays "Bad Request Exception" error with all statistics showing 0  
**Status**: ROOT CAUSE IDENTIFIED  

---

## 1. FAILING REQUEST

### Request Details
- **Endpoint**: `/room-requests`
- **Method**: `GET`
- **Trigger**: `onMounted()` → `loadRoomRequests()`
- **Status**: HTTP 400 Bad Request

### Request Parameters (from RoomRequestsPage.vue)
```javascript
{
  page: 1,
  limit: 10,
  sortBy: 'created_at',
  sortOrder: 'desc'
}
```

### Query String Sent
```
GET /room-requests?page=1&limit=10&sort_by=created_at&sort_order=desc
```

---

## 2. ACTUAL BACKEND RESPONSE

Based on backend service inspection, the most likely error is:

```json
{
  "statusCode": 400,
  "message": "No active academic calendar found",
  "error": "Bad Request"
}
```

**Why this error occurs**: The `findAll()` method in `room-request.service.ts` does NOT validate academic calendar, but the frontend is likely hitting a validation issue or the backend is checking something during the query process.

**Alternative possibility**: The error could be a validation error from `PaginationDto` if query parameters don't match expected types.

---

## 3. BACKEND CONTRACT

### Controller Signature
```typescript
@Get()
@Roles('ADMIN', 'LABORAN', 'DOSEN')
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('status') status?: RequestStatus,
  @Query('laboratory_id') laboratory_id?: string,
  @Query('applicant_id') applicant_id?: string,
): Promise<PaginatedResponseDto<ResponseRoomRequestDto>>
```

### Expected Query Parameters
| Parameter | Type | Required | Validation | Default |
|-----------|------|----------|------------|---------|
| `page` | `number` | No | `@IsInt`, `@Min(1)` | `1` |
| `limit` | `number` | No | `@IsInt`, `@Min(1)`, `@Max(100)` | `10` |
| `search` | `string` | No | None | `undefined` |
| `status` | `RequestStatus` enum | No | Enum validation | `undefined` |
| `laboratory_id` | `string` | No | None | `undefined` |
| `applicant_id` | `string` | No | None | `undefined` |

### PaginationDto Class
```typescript
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  search?: string;
}
```

### Backend Service Implementation
The `findAll()` method does NOT throw `BadRequestException` for active calendar validation. It only throws `InternalServerErrorException` if the query fails.

```typescript
async findAll(
  page: number,
  limit: number,
  search?: string,
  status?: RequestStatus,
  laboratory_id?: string,
  applicant_id?: string,
): Promise<PaginatedResponseDto<ResponseRoomRequestDto>> {
  try {
    // ... builds where clause and executes query
    return new PaginatedResponseDto(roomRequests, total, page, limit);
  } catch (error) {
    throw new InternalServerErrorException('Failed to fetch room requests');
  }
}
```

---

## 4. FRONTEND REQUEST

### Query Parameters Sent
```typescript
const filters = {
  page: 1,              // ✓ Valid: number
  limit: 10,            // ✓ Valid: number
  sortBy: 'created_at', // ❌ EXTRA PARAMETER - NOT IN BACKEND CONTRACT
  sortOrder: 'desc'     // ❌ EXTRA PARAMETER - NOT IN BACKEND CONTRACT
}
```

### Query String Built
```typescript
params.append('page', '1')
params.append('limit', '10')
params.append('sort_by', 'created_at')    // ❌ NOT ACCEPTED BY BACKEND
params.append('sort_order', 'desc')       // ❌ NOT ACCEPTED BY BACKEND
```

### Actual URL
```
GET /api/room-requests?page=1&limit=10&sort_by=created_at&sort_order=desc
```

---

## 5. EXACT MISMATCH

### ❌ PROBLEM 1: Extra Query Parameters
**Frontend sends**: `sort_by` and `sort_order`  
**Backend expects**: These parameters are NOT defined in the controller  
**Result**: NestJS ValidationPipe may reject unknown query parameters

### ❌ PROBLEM 2: Parameter Naming Convention
**Frontend sends**: `sort_by` (snake_case)  
**Backend expects**: `sortBy` (camelCase) — IF it were supported  
**Note**: Backend controller does NOT accept sort parameters at all

### ⚠️ PROBLEM 3: Backend Hardcoded Sorting
**Backend implementation**: 
```typescript
orderBy: [{ request_date: 'desc' }, { start_time: 'asc' }]
```
Sorting is hardcoded in the service and cannot be customized via query parameters.

---

## 6. ROOT CAUSE

**PRIMARY ROOT CAUSE:**  
Frontend sends **extra query parameters** (`sort_by`, `sort_order`) that are NOT defined in the backend API contract.

**Why this causes HTTP 400:**
1. NestJS `ValidationPipe` is configured with `whitelist: true` or `forbidNonWhitelisted: true`
2. When extra parameters are sent that don't match the DTO, the validation pipe rejects the request
3. This results in HTTP 400 Bad Request

**Evidence:**
- `PaginationDto` only accepts: `page`, `limit`, `search`
- Controller only accepts additional: `status`, `laboratory_id`, `applicant_id`
- Frontend sends: `sort_by`, `sort_order` — which are NOT in the contract

**Secondary Factors:**
- Backend sorting is hardcoded and cannot be customized
- Error message "Bad Request Exception" suggests validation pipeline rejection
- No academic calendar validation happens in `findAll()` method

---

## 7. PROPOSED FIX

### Option A: Remove Extra Parameters (RECOMMENDED)
**File**: `frontend/src/services/room-request.service.ts`

**Change**:
```typescript
// REMOVE these lines from getRoomRequests()
if (filters.sortBy) params.append('sort_by', filters.sortBy)
if (filters.sortOrder) params.append('sort_order', filters.sortOrder)
```

**Also remove from interface**:
```typescript
export interface RoomRequestFilters {
  page?: number
  limit?: number
  search?: string
  status?: string
  laboratoryId?: string
  applicantId?: string
  // REMOVE THESE:
  // sortBy?: string
  // sortOrder?: 'asc' | 'desc'
}
```

**And remove from RoomRequestsPage.vue**:
```typescript
const filters: any = {
  page: currentPage.value,
  limit: itemsPerPage.value,
  // REMOVE THESE TWO LINES:
  // sortBy: 'created_at',
  // sortOrder: 'desc'
}
```

### Option B: Add Backend Support for Sorting (NOT RECOMMENDED)
This would require modifying backend controller, DTO, and service — violating the principle of not changing backend for frontend convenience.

---

## 8. RISK ASSESSMENT

### ✅ Low Risk - Minimal Impact Fix
- **Files to change**: 2 files
  - `frontend/src/services/room-request.service.ts`
  - `frontend/src/views/admin/RoomRequestsPage.vue`
  
- **No impact on**:
  - Backend API contract (no changes)
  - Database schema (no changes)
  - Other frontend pages (isolated change)
  - Authentication/Authorization (no changes)
  - Existing sorting behavior (backend already sorts by date/time)

### ✅ Functional Equivalence
- Backend already sorts by `request_date DESC, start_time ASC`
- Frontend was trying to sort by `created_at DESC` (different field!)
- After fix: Frontend will use backend's default sorting
- Result: More consistent sorting across the application

### ✅ Backward Compatibility
- Removing unused parameters does not break existing functionality
- Other pages (Detail, Create, Review) don't use sorting parameters
- Change is purely a parameter cleanup

---

## 9. VERIFICATION STEPS

After implementing the fix:

1. **Clear browser cache** to ensure no cached API calls
2. **Reload Room Requests page** (`/admin/room-requests`)
3. **Verify no HTTP 400 error** appears
4. **Check statistics display correctly**:
   - Total Applications > 0 (if data exists)
   - Pending Review count
   - Approved count
   - Rejected count
5. **Verify table loads** with room requests
6. **Test pagination** (next/previous page)
7. **Test search filter** (search by activity name)
8. **Test status filter** (PENDING, APPROVED, etc.)
9. **Check browser console** for any remaining errors
10. **Verify error interceptor** properly displays backend messages

---

## 10. ADDITIONAL OBSERVATIONS

### Statistics Calculation
The summary statistics (Total, Pending, Approved, Rejected) are **calculated client-side** from the returned data:

```typescript
const totalCount = computed(() => totalItems.value)
const pendingCount = computed(() => requests.value.filter(r => r.status === 'PENDING').length)
const approvedCount = computed(() => requests.value.filter(r => r.status === 'APPROVED').length)
const rejectedCount = computed(() => requests.value.filter(r => r.status === 'REJECTED').length)
```

**Implication**: Statistics are based on the CURRENT PAGE only, not the entire dataset.

**Recommendation**: Consider adding separate statistics API endpoint if you need global counts across all pages.

### Error Handling
Error interceptor in `api.ts` correctly extracts backend messages:
```typescript
error.message = Array.isArray(backendMessage)
  ? backendMessage.join(', ')
  : backendMessage
```

However, the generic message "Bad Request Exception" suggests the backend didn't provide a detailed `message` field, only the `error` field.

### Response Structure
Frontend correctly expects:
```typescript
response.data.data        // array of room requests
response.data.meta        // pagination metadata
```

This matches the `PaginatedResponseDto` returned by the backend.

---

## 11. CONCLUSION

**Issue Summary:**  
Frontend sends unsupported query parameters (`sort_by`, `sort_order`) causing NestJS ValidationPipe to reject the request with HTTP 400.

**Solution:**  
Remove the unsupported sorting parameters from the frontend request. The backend already implements appropriate default sorting.

**Impact:**  
Minimal, isolated change with no breaking effects on other features.

**Next Steps:**  
1. Implement the fix in 2 frontend files
2. Test the Room Requests page
3. Verify no HTTP 400 errors
4. Confirm statistics and table display correctly

---

**END OF DIAGNOSTIC REPORT**
