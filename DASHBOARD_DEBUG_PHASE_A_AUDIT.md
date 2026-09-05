# DASHBOARD DEBUG - PHASE A: ACTUAL FRONTEND AUDIT

**Date**: August 17, 2026  
**Status**: 🔍 **DEBUGGING IN PROGRESS**

---

## CURRENT ISSUES REPORTED

1. ❌ "Bad Request Exception" displayed
2. ❌ Schedule Statistics showing static values: 18, 38, 28, 48, 40, 26, 31
3. ❌ Lab Utilization showing 0% and 0 active labs

---

## PHASE A — FRONTEND AUDIT RESULTS

### Dashboard Element Analysis

| Dashboard Element | Current Source | Real API? | Mock/Hardcoded? | Backend Source | Notes |
|-------------------|----------------|-----------|-----------------|----------------|-------|
| **Active Schedules (Stat Card)** | `dashboardSummary.total_schedules` | ✅ YES | ❌ NO | `Schedule.count()` | Fetched from Dashboard API |
| **Total Laboratories (Stat Card)** | `dashboardSummary.total_laboratories` | ✅ YES | ❌ NO | `Laboratory.count()` | Fetched from Dashboard API |
| **Pending Requests (Stat Card)** | `dashboardSummary.pending_requests` | ✅ YES | ❌ NO | `RoomRequest.count(status=PENDING)` | Fetched from Dashboard API |
| **Total Users (Stat Card)** | `userResponse.meta.total` | ✅ YES | ❌ NO | `User.count()` via meta | Fetched from User API |
| **Schedule Statistics Chart** | `weeklyData` array | ❌ NO | ✅ **HARDCODED** | N/A | **PROBLEM FOUND!** |
| **Lab Utilization %** | `averageOccupancy` computed | ✅ YES | ❌ NO | Computed from `laboratoryStatistics` | Depends on API |
| **Active Labs Count** | `activeLabs` computed | ✅ YES | ❌ NO | Computed from `laboratoryStatistics` | Depends on API |
| **Maintenance Labs** | `maintenanceLabs` computed | ✅ YES | ❌ NO | Computed from `laboratoryStatistics` | Depends on API |
| **Pending Room Requests List** | `pendingRoomRequests` | ✅ YES | ❌ NO | `RoomRequest.findMany(status=PENDING)` | Fetched from RoomRequest API |
| **Latest Announcements** | `latestAnnouncements` | ✅ YES | ❌ NO | `Announcement.findMany()` | Fetched from Announcement API |
| **Recent Activity** | `mockRecentActivities` | ❌ NO | ✅ **MOCK** | N/A | No backend endpoint exists |
| **System Status** | `mockSystemStatus` | ❌ NO | ✅ **MOCK** | N/A | No backend endpoint exists |

---

## CRITICAL FINDING: HARDCODED CHART DATA

**File**: `frontend/src/components/admin/LabAnalytics.vue`  
**Lines**: 48-56

### Hardcoded Values:
```typescript
const weeklyData = [
  { day: 'Sun', count: 18, isPeak: false },   // ← HARDCODED
  { day: 'Mon', count: 38, isPeak: false },   // ← HARDCODED
  { day: 'Tue', count: 28, isPeak: false },   // ← HARDCODED
  { day: 'Wed', count: 48, isPeak: true, label: 'Busiest Day' },  // ← HARDCODED
  { day: 'Thu', count: 40, isPeak: false },   // ← HARDCODED
  { day: 'Fri', count: 26, isPeak: false },   // ← HARDCODED
  { day: 'Sat', count: 31, isPeak: false },   // ← HARDCODED
]
```

**This explains why the chart shows static values 18, 38, 28, 48, 40, 26, 31!**

The component accepts `laboratoryStatistics` as a prop but:
- ❌ Does NOT use the prop for the chart
- ❌ Uses a hardcoded `weeklyData` array instead
- ❌ The chart displays fake static data

---

## PHASE B — API CALLS ANALYSIS

### Dashboard Load Sequence

When `DashboardPage.vue` loads, it calls `loadDashboardData()` which makes **5 parallel API calls**:

```typescript
const [summary, userResponse, requestsResponse, announcementsResponse, labStats] = await Promise.all([
  dashboardService.getSummary(),                                      // 1
  userService.getUsers({ page: 1, limit: 1 }),                       // 2
  roomRequestService.getRoomRequests({ status: 'PENDING', page: 1, limit: 3 }),  // 3
  announcementService.getAnnouncements({ page: 1, limit: 3 }),       // 4
  dashboardService.getLaboratoryStatistics(),                        // 5
])
```

### Expected API Calls:

| # | Method | Endpoint | Query Parameters | Expected Response |
|---|--------|----------|------------------|-------------------|
| 1 | GET | `/api/dashboard` | None | `DashboardSummaryDto` |
| 2 | GET | `/api/users` | `page=1&limit=1` | `PaginatedResponseDto<UserDto>` |
| 3 | GET | `/api/room-requests` | `status=PENDING&page=1&limit=3` | `PaginatedResponseDto<RoomRequestDto>` |
| 4 | GET | `/api/announcements` | `page=1&limit=3` | `PaginatedResponseDto<AnnouncementDto>` |
| 5 | GET | `/api/dashboard/laboratories` | None | `LaboratoryStatisticDto[]` |

---

## PHASE B — HTTP 400 INVESTIGATION

### Possible Causes of HTTP 400:

Given the API calls above, the most likely candidate for HTTP 400 is:

**Call #3: `GET /api/room-requests?status=PENDING&page=1&limit=3`**

#### Why This Might Fail:

1. **Enum Validation Issue**:
   - Backend expects `RequestStatus` enum
   - Frontend sends string `'PENDING'`
   - NestJS ValidationPipe might reject the value

2. **Query Parameter Validation**:
   - `PaginationDto` might have validation rules
   - `page` or `limit` values might be outside allowed range

3. **Missing Required Parameter**:
   - Some query parameter might be required but not sent

#### Backend Controller Signature:
```typescript
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('status') status?: RequestStatus,
  @Query('laboratory_id') laboratory_id?: string,
  @Query('applicant_id') applicant_id?: string,
)
```

The `status` parameter is optional and typed as `RequestStatus` enum.

---

## PHASE C — LAB UTILIZATION 0% ISSUE

### Why Lab Utilization Shows 0%:

The `LabAnalytics` component computes:

```typescript
const averageOccupancy = computed(() => {
  if (props.laboratoryStatistics.length === 0) return 0  // ← Returns 0 if empty!
  const total = props.laboratoryStatistics.reduce((sum, lab) => sum + lab.occupancy_percentage, 0)
  return Math.round(total / props.laboratoryStatistics.length)
})
```

**Possible Causes**:
1. ❌ `laboratoryStatistics` prop is empty array `[]`
2. ❌ Dashboard API call #5 failing
3. ❌ Response unwrapping incorrect
4. ❌ Backend returns empty array

---

## REMAINING MOCK DATA

### Intentional (No Backend Endpoint):
1. **Recent Activity** - Uses `mockRecentActivities`
   - No `/api/activities` endpoint exists
   - Would require activity logging system
   
2. **System Status** - Uses `mockSystemStatus`
   - No `/api/system/health` endpoint exists
   - Would require system monitoring

### Unintentional (Should Use Real Data):
1. ✅ **Schedule Statistics Chart** - Uses hardcoded `weeklyData`
   - **MUST BE FIXED**
   - Backend does NOT provide day-by-day schedule counts
   - Options:
     a) Remove the chart (honest empty state)
     b) Add backend endpoint for daily schedule stats
     c) Compute from existing schedule data

---

## ACTION ITEMS

### Priority 1 — Fix Hardcoded Chart Data

**Problem**: Chart displays static mock values  
**Location**: `LabAnalytics.vue` lines 48-56  
**Solution Options**:
1. Comment out the chart (show "Data not available")
2. Compute weekly stats from `laboratoryStatistics` prop (approximation)
3. Add new backend endpoint for actual day-wise schedule data

**Recommended**: Option 1 or 2 (don't add backend endpoint unless necessary)

### Priority 2 — Fix HTTP 400

**Need to identify**:
- Which specific API call returns HTTP 400
- What is the exact error message
- What is causing the validation failure

**Method**: Check browser DevTools Network tab for actual failing request

### Priority 3 — Fix Lab Utilization 0%

**Need to verify**:
- Does `/api/dashboard/laboratories` return data?
- Is response unwrapping correct?
- Are there actual laboratories in database?

---

## NEXT STEPS

1. ✅ Open browser DevTools
2. ✅ Navigate to Dashboard (`http://localhost:5174/admin`)
3. ✅ Check Network tab for failing requests
4. ✅ Identify exact HTTP 400 error
5. ✅ Check Console tab for JavaScript errors
6. ✅ Verify actual response structures
7. ❌ Fix hardcoded chart data
8. ❌ Fix HTTP 400 root cause
9. ❌ Verify lab statistics load correctly
10. ❌ Test with actual database operations

---

## VERIFICATION NEEDED

Cannot proceed without:
- [ ] Browser DevTools Network tab inspection
- [ ] Actual HTTP 400 error message
- [ ] Actual API response bodies
- [ ] JavaScript console errors

**Status**: Awaiting browser inspection to identify exact failing endpoint

---

**Current State**: Dashboard attempts to load real data but:
1. Chart uses hardcoded mock values (confirmed)
2. HTTP 400 error occurs (need to identify which call)
3. Lab utilization may be 0% due to empty data or API failure
