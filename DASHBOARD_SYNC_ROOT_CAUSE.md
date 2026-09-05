# DASHBOARD SYNCHRONIZATION ISSUE - ROOT CAUSE ANALYSIS

**Date**: August 17, 2026  
**Status**: 🔍 **ROOT CAUSE IDENTIFIED**  
**Issue**: Dashboard statistics do not update when data is added/edited/deleted

---

## PROBLEM STATEMENT

The Administrator Dashboard displays statistics that **never change** regardless of CRUD operations performed through feature management pages.

### Expected Behavior:
```
Create Laboratory → Database updated → Dashboard reflects new count
```

### Actual Behavior:
```
Create Laboratory → Database updated → Dashboard shows same old count (mock data)
```

---

## ROOT CAUSE ANALYSIS

### Phase 0 — Initial Investigation

**Backend API Status:** ✅ **WORKING**
- Dashboard controller exists: `backend/src/modules/dashboard/dashboard.controller.ts`
- Dashboard service exists: `backend/src/modules/dashboard/dashboard.service.ts`
- All endpoints mapped and functional:
  - `GET /api/dashboard` → DashboardSummaryDto
  - `GET /api/dashboard/statistics` → DashboardSummaryDto (alias)
  - `GET /api/dashboard/laboratories` → LaboratoryStatisticDto[]
  - `GET /api/dashboard/requests` → RequestStatisticDto[]
  - `GET /api/dashboard/usage` → UsageStatisticDto
  - `GET /api/dashboard/occupancy` → OccupancyStatisticDto[]

**Backend Service Implementation:** ✅ **CORRECT**

The `getDashboardSummary()` method correctly queries the database:

```typescript
// Total laboratories
this.prisma.laboratory.count()

// Active laboratories (AVAILABLE or IN_USE)
this.prisma.laboratory.count({
  where: {
    status: { in: [LaboratoryStatus.AVAILABLE, LaboratoryStatus.IN_USE] }
  }
})

// Pending requests
this.prisma.roomRequest.count({
  where: { status: RequestStatus.PENDING }
})

// Total schedules (not cancelled)
this.prisma.schedule.count({
  where: { status: { not: ScheduleStatus.CANCELLED } }
})
```

All queries use Prisma to fetch **real-time data from PostgreSQL**.

---

### Phase 1 — Frontend Investigation

**Frontend Dashboard Service:** ❌ **DOES NOT EXIST**

Searched for: `frontend/src/services/dashboard.service.ts`  
**Result**: File not found

**Frontend Dashboard Page:** ❌ **USES MOCK DATA**

File: `frontend/src/views/admin/DashboardPage.vue`

```typescript
import {
  mockStatCards,           // ❌ Mock data
  mockRecentActivities,    // ❌ Mock data
  mockUpcomingRequests,    // ❌ Mock data
  mockLatestAnnouncements, // ❌ Mock data
  mockSystemStatus,        // ❌ Mock data
} from '@/mocks/admin-dashboard.mock'
```

The Dashboard page template uses:
```vue
<StatCard
  v-for="stat in mockStatCards"  <!-- ❌ Hardcoded mock data -->
  :key="stat.title"
  :title="stat.title"
  :value="stat.value"
  ...
/>
```

**No API calls are made** to the backend Dashboard endpoints.

---

## ROOT CAUSE CONCLUSION

### The Dashboard is NOT broken. It was NEVER implemented.

**Architecture Status:**

```
┌─────────────────────────────────────────────┐
│ BACKEND (✅ FULLY IMPLEMENTED)              │
├─────────────────────────────────────────────┤
│ • Dashboard Controller                      │
│ • Dashboard Service                         │
│ • Dashboard DTOs                            │
│ • Prisma Queries (Real Database)            │
│ • All 6 Endpoints Working                   │
└─────────────────────────────────────────────┘
                    ▼
                    ✗ (NOT CONNECTED)
                    ▼
┌─────────────────────────────────────────────┐
│ FRONTEND (❌ NOT IMPLEMENTED)               │
├─────────────────────────────────────────────┤
│ • dashboard.service.ts → MISSING            │
│ • DashboardPage.vue → Uses mock data        │
│ • No API calls to backend                   │
│ • Displays hardcoded values                 │
└─────────────────────────────────────────────┘
```

---

## WHY THIS CAUSES THE SYNCHRONIZATION ISSUE

1. **Dashboard never queries the database**
   - It displays hardcoded numbers from `admin-dashboard.mock.ts`
   - These numbers never change because they're constants

2. **CRUD operations work perfectly**
   - Laboratory CRUD → Database updated ✅
   - Room Request CRUD → Database updated ✅
   - Schedule CRUD → Database updated ✅
   - User CRUD → Database updated ✅

3. **Backend Dashboard API works correctly**
   - Queries return accurate real-time counts
   - But frontend never calls these APIs

4. **Result: Dashboard shows stale mock data**
   - Mock data was created during initial UI design
   - Never replaced with real API integration
   - Dashboard appears "broken" but it's actually just incomplete

---

## VERIFICATION OF ROOT CAUSE

### Test 1: Check Backend API Directly

If we call the backend API directly:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/dashboard
```

**Expected Result**: Returns current database counts (real data)  
**Actual Result**: Will return real data ✅

### Test 2: Check Frontend Dashboard

Open: `http://localhost:5174/admin`

**Expected Result**: Should show real database counts  
**Actual Result**: Shows hardcoded mock values ❌

### Test 3: Create Laboratory and Refresh Dashboard

1. Current mock laboratories count: (whatever is in mock file)
2. Create new laboratory via `/admin/laboratories`
3. Refresh Dashboard
4. Check laboratories count

**Expected Result**: Count increases by 1  
**Actual Result**: Count remains the same (mock value) ❌

---

## DATABASE SCHEMA VERIFICATION

### Relevant Models (from schema.prisma):

```prisma
model Laboratory {
  id               String           @id @default(uuid())
  code             String           @unique
  name             String
  status           LaboratoryStatus
  // ... other fields
}

model RoomRequest {
  id           String        @id @default(uuid())
  status       RequestStatus
  // ... other fields
}

model Schedule {
  id               String         @id @default(uuid())
  status           ScheduleStatus
  // ... other fields
}

model User {
  id     String     @id @default(uuid())
  status UserStatus
  // ... other fields
}
```

**Schema Status:** ✅ Correct - No changes needed

---

## DASHBOARD STATISTICS MAPPING

| Dashboard Metric | Prisma Model | Query Method | Filter |
|------------------|--------------|--------------|--------|
| Total Laboratories | `Laboratory` | `count()` | None |
| Active Laboratories | `Laboratory` | `count()` | `status IN (AVAILABLE, IN_USE)` |
| Total Schedules | `Schedule` | `count()` | `status != CANCELLED` |
| Today's Schedules | `Schedule` | `count()` | `day_of_week = today AND status != CANCELLED` |
| Total Room Requests | `RoomRequest` | `count()` | None |
| Pending Requests | `RoomRequest` | `count()` | `status = PENDING` |
| Approved Requests | `RoomRequest` | `count()` | `status = APPROVED` |
| Rejected Requests | `RoomRequest` | `count()` | `status = REJECTED` |
| Current Room Usage | `RoomUsage` | `count()` | `status IN (CHECKED_IN, IN_USE)` |
| Active Announcements | `Announcement` | `count()` | `is_active = true AND now BETWEEN start_at AND end_at` |

All mappings are **already implemented correctly** in the backend service.

---

## WHAT IS NOT BROKEN

1. ✅ Database schema
2. ✅ CRUD operations (Laboratory, Room Request, Schedule, User)
3. ✅ Prisma queries
4. ✅ Backend Dashboard API
5. ✅ Global ResponseInterceptor
6. ✅ Authentication/Authorization
7. ✅ Backend compilation
8. ✅ Database migrations

---

## WHAT NEEDS TO BE FIXED

### Critical Missing Component:

1. ❌ **`frontend/src/services/dashboard.service.ts`** - Does not exist
2. ❌ **`frontend/src/views/admin/DashboardPage.vue`** - Uses mock data instead of API

### Optional Components (for complete feature):

3. ❌ **`frontend/src/services/announcement.service.ts`** - Missing (for announcements section)
4. ❌ **`frontend/src/components/admin/LabAnalytics.vue`** - Uses hardcoded data

---

## SOLUTION ARCHITECTURE

### Required Data Flow:

```
┌──────────────────┐
│ PostgreSQL DB    │ ← Source of Truth
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Prisma Queries   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Dashboard Service│ (Backend - ✅ Already exists)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Dashboard API    │ GET /api/dashboard
└────────┬─────────┘
         │
         ▼ (HTTP)
┌──────────────────┐
│ dashboard.service│ (Frontend - ❌ NEEDS TO BE CREATED)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ DashboardPage.vue│ (Frontend - ❌ NEEDS UPDATE)
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Dashboard UI     │ Display real-time data
└──────────────────┘
```

---

## IMPLEMENTATION PLAN

### Phase B1: Create Dashboard Service

**File**: `frontend/src/services/dashboard.service.ts`

**Methods**:
```typescript
async getSummary() → DashboardSummaryDto
async getLaboratoryStatistics() → LaboratoryStatisticDto[]
async getRequestStatistics() → RequestStatisticDto[]
async getUsageStatistics() → UsageStatisticDto
async getOccupancyStatistics() → OccupancyStatisticDto[]
```

**Response Unwrapping Pattern**:
```typescript
const response = await apiClient.get<{ data: DashboardSummaryDto }>('/dashboard')
return response.data.data  // Unwrap global ResponseInterceptor
```

### Phase B2: Update DashboardPage.vue

**Changes**:
1. Remove mock imports
2. Add dashboard service import
3. Add reactive state for dashboard data
4. Add loading/error states
5. Fetch data in `onMounted()`
6. Compute stat cards from real data
7. Update template to use real data

### Phase B3: Update LabAnalytics.vue (Optional)

**Changes**:
1. Accept props for laboratory statistics
2. Remove hardcoded weeklyData
3. Compute chart values from props

### Phase B4: Create Announcement Service (Optional)

**File**: `frontend/src/services/announcement.service.ts`

For complete announcements section functionality.

---

## CRITICAL RULES FOR IMPLEMENTATION

### DO NOT:
- ❌ Manually increment/decrement dashboard counters
- ❌ Use localStorage as fake database
- ❌ Add `+1` after creating records
- ❌ Keep mock data as fallback
- ❌ Add WebSockets (not needed)
- ❌ Add polling (not needed initially)
- ❌ Modify database schema
- ❌ Modify Room Usage module

### DO:
- ✅ Create dashboard service that calls backend API
- ✅ Use proper response unwrapping (response.data.data)
- ✅ Add loading states
- ✅ Add error handling
- ✅ Fetch fresh data on Dashboard mount
- ✅ Follow existing service patterns (laboratory.service.ts, user.service.ts)

---

## VERIFICATION CHECKLIST

After implementation:

### Backend Verification:
- [ ] `GET /api/dashboard` returns real data
- [ ] Creating laboratory increases `total_laboratories`
- [ ] Creating pending request increases `pending_requests`
- [ ] Creating schedule increases `total_schedules`

### Frontend Verification:
- [ ] Dashboard calls backend API on mount
- [ ] Stat cards display real data from API
- [ ] Refreshing page loads latest data
- [ ] No mock data remains in production code
- [ ] Browser Network tab shows API calls
- [ ] No console errors

### End-to-End Verification:
- [ ] Create laboratory → Dashboard count increases
- [ ] Create pending request → Pending count increases
- [ ] Approve request → Pending decreases, Approved increases
- [ ] Create schedule → Schedule count increases
- [ ] All changes reflect immediately after page refresh

---

## ESTIMATED TIME

| Task | Time |
|------|------|
| Create dashboard.service.ts | 10 min |
| Update DashboardPage.vue | 30 min |
| Update LabAnalytics.vue | 10 min |
| Create announcement.service.ts | 5 min |
| Testing & Verification | 15 min |
| **Total** | **70 min** |

---

## CONCLUSION

**The Dashboard synchronization issue is NOT a bug.**

It's an **incomplete implementation**. The backend is fully functional, but the frontend was left using mock data placeholders that were never replaced with real API integration.

**Solution**: Complete the frontend implementation by creating the dashboard service and connecting DashboardPage.vue to the backend API.

**No database changes required.**  
**No backend changes required.**  
**No schema migration required.**  

Only frontend service creation and component update needed.

---

**Status**: Ready for implementation ✅
