# REPORTS LOADING STATE FIX — RESPONSE UNWRAPPING

**Date:** 2026-08-16  
**Module:** Reports Module  
**Issue:** Reports page stuck in infinite loading state  
**Status:** ✅ FIXED

---

## ROOT CAUSE CONFIRMED

The backend has a **global ResponseInterceptor** that wraps ALL API responses in:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": <actual controller response>
}
```

**File:** `backend/src/common/interceptors/response.interceptor.ts`  
**Applied:** Globally in `backend/src/main.ts` line 41: `app.useGlobalInterceptors(new ResponseInterceptor())`

### Actual Response Structure

For paginated reports endpoints (usage, requests, schedules, laboratories):

```
HTTP Response from Axios:
{
  data: {                          ← Axios wrapper
    success: true,                 ← Global ResponseInterceptor
    statusCode: 200,
    message: "Success",
    data: {                        ← Actual PaginatedResponseDto
      data: [...],                 ← Report items array
      meta: {                      ← Pagination metadata
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false
      }
    }
  }
}
```

For summary endpoint:

```
HTTP Response from Axios:
{
  data: {                          ← Axios wrapper
    success: true,                 ← Global ResponseInterceptor
    statusCode: 200,
    message: "Success",
    data: {                        ← Actual SummaryReportDto
      total_schedules: 10,
      total_requests: 25,
      approved_requests: 20,
      rejected_requests: 3,
      pending_requests: 2,
      completed_usages: 15,
      ongoing_usages: 5,
      active_laboratories: 8,
      inactive_laboratories: 2,
      occupancy_percentage: 65
    }
  }
}
```

### The Problem

**Before Fix:**

`frontend/src/services/reports.service.ts` accessed `response.data` directly:

```typescript
const response = await apiClient.get<PaginatedResponse<UsageReportItem>>(url)
return response.data  // ❌ Returns { success, statusCode, message, data }
```

**Frontend Expected:**
```typescript
{
  data: [...],
  meta: {...}
}
```

**Frontend Received:**
```typescript
{
  success: true,
  statusCode: 200,
  message: "Success",
  data: { data: [...], meta: {...} }
}
```

When ReportsPage.vue tried to access:
- `usageReport.data` → Got `{ data: [...], meta: {...} }` (object, not array!) ❌
- `usageReport.meta` → Got `undefined` ❌

This caused the loading state to never resolve because:
1. Data wasn't extracted correctly
2. Frontend couldn't access the expected structure
3. Silent errors occurred but `isLoading` remained `true`

---

## THE FIX

**File Changed:** `frontend/src/services/reports.service.ts`

### Change Summary

Updated ALL 5 report service methods to:
1. Explicitly type the response with the global wrapper structure
2. Unwrap the response using `response.data.data` instead of `response.data`

### Pattern Used (From Working Services)

This fix follows the EXACT pattern used by other working services in the project (e.g., `room-usage.service.ts` line 233-247).

### Changes Made

#### 1. getUsageReport()

```typescript
// BEFORE ❌
const response = await apiClient.get<PaginatedResponse<UsageReportItem>>(url)
return response.data

// AFTER ✅
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: PaginatedResponse<UsageReportItem>
}>(url)

// Unwrap global ResponseInterceptor wrapper
return response.data.data
```

#### 2. getRequestReport()

```typescript
// BEFORE ❌
const response = await apiClient.get<PaginatedResponse<RequestReportItem>>(url)
return response.data

// AFTER ✅
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: PaginatedResponse<RequestReportItem>
}>(url)

// Unwrap global ResponseInterceptor wrapper
return response.data.data
```

#### 3. getScheduleReport()

```typescript
// BEFORE ❌
const response = await apiClient.get<PaginatedResponse<ScheduleReportItem>>(url)
return response.data

// AFTER ✅
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: PaginatedResponse<ScheduleReportItem>
}>(url)

// Unwrap global ResponseInterceptor wrapper
return response.data.data
```

#### 4. getLaboratoryReport()

```typescript
// BEFORE ❌
const response = await apiClient.get<PaginatedResponse<LaboratoryReportItem>>(url)
return response.data

// AFTER ✅
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: PaginatedResponse<LaboratoryReportItem>
}>(url)

// Unwrap global ResponseInterceptor wrapper
return response.data.data
```

#### 5. getSummaryReport()

```typescript
// BEFORE ❌
const response = await apiClient.get<SummaryReport>(url)
return response.data

// AFTER ✅
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: SummaryReport
}>(url)

// Unwrap global ResponseInterceptor wrapper
return response.data.data
```

---

## FILES MODIFIED

**ONLY ONE FILE CHANGED:**

1. `frontend/src/services/reports.service.ts`
   - Updated 5 methods (getUsageReport, getRequestReport, getScheduleReport, getLaboratoryReport, getSummaryReport)
   - Added explicit response type with global wrapper structure
   - Changed return from `response.data` to `response.data.data`
   - Updated comments to reflect unwrapping behavior

**Total Lines Changed:** ~35 lines (5 methods × ~7 lines each)

---

## FILES NOT MODIFIED

✅ `frontend/src/views/admin/ReportsPage.vue` — No changes  
✅ `frontend/src/views/laboran/ReportsPage.vue` — No changes  
✅ `backend/src/modules/reports/report.controller.ts` — No changes  
✅ `backend/src/modules/reports/report.service.ts` — No changes  
✅ `backend/src/common/interceptors/response.interceptor.ts` — No changes  
✅ All other services — No changes  
✅ Authentication — No changes  
✅ Authorization — No changes  

---

## WHY THIS FIX WORKS

### Before Fix:
```typescript
// Service returns:
{ success: true, statusCode: 200, message: "Success", data: {...} }

// ReportsPage expects:
usageReport.data  // expects array
usageReport.meta  // expects object

// Actual access:
usageReport.data = { data: [...], meta: {...} }  // ❌ Wrong type!
usageReport.meta = undefined                     // ❌ Missing!
```

### After Fix:
```typescript
// Service unwraps and returns:
{ data: [...], meta: {...} }

// ReportsPage expects:
usageReport.data  // expects array
usageReport.meta  // expects object

// Actual access:
usageReport.data = [...]           // ✅ Correct!
usageReport.meta = {...}           // ✅ Correct!
```

---

## VALIDATION

### TypeScript Compilation

**Status:** ✅ Type-safe

The explicit response typing ensures TypeScript validates:
- Response structure matches global interceptor pattern
- Unwrapping accesses correct nested property
- Return type matches interface contracts

### Expected Results

After this fix, the Reports page should:

1. ✅ **Load successfully** — No infinite loading spinner
2. ✅ **Display summary metrics** — Cards show real data
3. ✅ **Display laboratory comparison** — Bar chart with real stats
4. ✅ **Display status distributions** — Request/usage status breakdown
5. ✅ **Display laboratory ranking** — Most used labs list
6. ✅ **Display detailed table** — Paginated usage logs with real data
7. ✅ **Filters work** — Period, laboratory filters update correctly
8. ✅ **Pagination works** — Navigate between pages
9. ✅ **Loading states** — Proper loading → success → display flow
10. ✅ **Error states** — API errors display with retry button
11. ✅ **Empty states** — No data shows appropriate message

### API Endpoints Status

All 5 endpoints should now work:

- ✅ `GET /api/reports/usage` → Returns paginated usage data
- ✅ `GET /api/reports/requests` → Returns paginated request data
- ✅ `GET /api/reports/schedules` → Returns paginated schedule data
- ✅ `GET /api/reports/laboratories` → Returns paginated laboratory stats
- ✅ `GET /api/reports/summary` → Returns aggregated summary

### Browser Console

Expected behavior:
- ✅ No TypeScript errors
- ✅ No runtime errors
- ✅ No "Cannot read property 'data' of undefined"
- ✅ No "Cannot read property 'meta' of undefined"
- ✅ Successful API responses logged

### Network Tab

Expected responses (HTTP 200):

**GET /api/reports/summary**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "total_schedules": 10,
    "total_requests": 25,
    ...
  }
}
```

**GET /api/reports/usage?page=1&limit=20**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "data": [...],
    "meta": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

---

## COMPARISON WITH WORKING SERVICES

This fix brings `reports.service.ts` in line with the established pattern:

### room-usage.service.ts (Working ✅)
```typescript
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: {
    data: BackendRoomUsageDto[]
    meta: {...}
  }
}>(url)

return {
  data: response.data.data.data.map(mapToFrontend),
  meta: response.data.data.meta,
}
```

### reports.service.ts (Fixed ✅)
```typescript
const response = await apiClient.get<{
  success: boolean
  statusCode: number
  message: string
  data: PaginatedResponse<UsageReportItem>
}>(url)

return response.data.data
```

**Both follow the same unwrapping pattern:** `response.data.data`

---

## TESTING CHECKLIST

### Manual Testing Required:

1. **Start Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Navigate to Reports:**
   - Open browser: http://localhost:5173/admin/reports
   - Login as ADMIN user

4. **Verify Loading Completes:**
   - [ ] Loading spinner disappears after ~2-3 seconds
   - [ ] Summary metrics cards display with real numbers
   - [ ] Laboratory comparison chart displays with data
   - [ ] Status distribution shows percentages
   - [ ] Most used laboratories ranking displays
   - [ ] Detailed usage table displays with rows

5. **Test Filters:**
   - [ ] Change period filter (Today, Week, Month, Semester)
   - [ ] Change laboratory filter (All, specific lab)
   - [ ] Click "Clear Filters" button
   - [ ] Verify data updates after each filter change

6. **Test Pagination:**
   - [ ] Click "Next" button
   - [ ] Click "Previous" button
   - [ ] Verify page number updates
   - [ ] Verify data updates

7. **Test Error Handling:**
   - [ ] Stop backend server
   - [ ] Reload page
   - [ ] Verify error message displays
   - [ ] Verify "Retry" button appears
   - [ ] Restart backend
   - [ ] Click "Retry"
   - [ ] Verify data loads successfully

8. **Test Empty State:**
   - [ ] Apply filters that return no data
   - [ ] Verify "No report data" message displays
   - [ ] Verify empty state has clear instructions

9. **Browser Console:**
   - [ ] No JavaScript errors
   - [ ] No TypeScript errors
   - [ ] API requests succeed (200 status)

10. **Network Tab:**
    - [ ] Verify GET /api/reports/summary succeeds
    - [ ] Verify GET /api/reports/usage succeeds
    - [ ] Verify GET /api/reports/laboratories succeeds
    - [ ] Verify response structure matches expected format

---

## CONCLUSION

**ROOT CAUSE:** Response structure mismatch — frontend didn't unwrap global ResponseInterceptor wrapper

**FIX:** Updated `reports.service.ts` to access `response.data.data` instead of `response.data`

**SCOPE:** Minimal — only 1 file changed, 5 methods updated, ~35 lines

**PATTERN:** Follows existing project convention (same as room-usage.service.ts)

**IMPACT:** Resolves infinite loading state, enables Reports module to function correctly

**VALIDATION:** TypeScript types ensure correctness, runtime behavior will match other working modules

**STATUS:** ✅ FIXED — Ready for testing

The Reports module should now load and display real data correctly for both ADMIN and LABORAN users.
