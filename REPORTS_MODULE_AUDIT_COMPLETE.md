# Reports Module - Phase 1 Audit Complete

**Task**: Develop and complete the Reports Module  
**Status**: Audit Phase Complete — Ready for Design Proposal  
**Date**: August 16, 2026

---

## EXECUTIVE SUMMARY

The Reports module has **substantial existing implementation** on both backend and frontend. Backend is production-ready with 5 comprehensive endpoints. Frontend has polished UI pages for both Admin and Laboran roles, but **all data is currently mocked** — no real API integration exists.

**Key Finding**: This is NOT a greenfield project. We need to:
1. Create frontend report service (currently missing)
2. Replace mock data with real API calls
3. Verify backend endpoints work correctly
4. Minor UI adjustments if needed for real data

---

## PHASE 1: COMPLETE AUDIT RESULTS

### ✅ BACKEND IMPLEMENTATION (COMPLETE)

#### Module Registration
- **Status**: ✅ **REGISTERED**
- **Location**: `backend/src/app.module.ts`
- **Module Name**: `ReportModule` (imported as `./modules/reports/report.module.js`)

#### Backend Files (All Exist)
1. ✅ `backend/src/modules/reports/report.module.ts`
2. ✅ `backend/src/modules/reports/report.controller.ts`
3. ✅ `backend/src/modules/reports/report.service.ts`
4. ✅ `backend/src/modules/reports/dto/report-filters.dto.ts`
5. ✅ `backend/src/modules/reports/dto/report-response.dto.ts`

#### Backend Endpoints (5 Total)

All endpoints use **GET** method with query string filters:

| Endpoint | Purpose | Response DTO |
|----------|---------|--------------|
| `GET /reports/usage` | Room usage statistics | `UsageReportDto[]` |
| `GET /reports/requests` | Room request analytics | `RequestReportDto[]` |
| `GET /reports/schedules` | Schedule distribution | `ScheduleReportDto[]` |
| `GET /reports/laboratories` | Laboratory performance metrics | `LaboratoryReportDto[]` |
| `GET /reports/summary` | Aggregated system summary | `SummaryReportDto` |

#### Authorization
- **Role**: `ADMIN` only (via `@Roles('ADMIN')` decorator)
- **Note**: Laboran role may need to be added if laboran users should access reports

#### Query Parameters (ReportFilterDto)

All endpoints accept these optional query parameters:

```typescript
{
  start_date?: string      // ISO date format (e.g., "2026-08-01")
  end_date?: string        // ISO date format (e.g., "2026-08-31")
  laboratory_id?: string   // UUID
  status?: string          // Depends on entity (UsageStatus, RequestStatus, etc.)
  user_id?: string         // UUID
  room_request_id?: string // UUID
  schedule_id?: string     // UUID
  search?: string          // General text search
  page?: number            // Default: 1, min: 1
  limit?: number           // Default: 10, min: 1
}
```

#### Response Structure

Based on project conventions (from Room Usage module):
```typescript
{
  success: boolean
  statusCode: number
  message: string
  data: {
    // For paginated lists:
    data: ReportDto[]  // Array of report items
    meta: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    
    // OR for single summary:
    // SummaryReportDto object directly
  }
}
```

#### Backend Data Models (Prisma Schema)

All necessary models exist in `backend/prisma/schema.prisma`:
- ✅ `RoomUsage` (with relations to User, RoomRequest, Schedule)
- ✅ `RoomRequest` (with relations to User, Laboratory)
- ✅ `Schedule` (with relations to Laboratory, AcademicCalendar)
- ✅ `Laboratory` (with relations to Facilities, OperationalHours)
- ✅ Status enums: `UsageStatus`, `RequestStatus`, `ScheduleStatus`, `LaboratoryStatus`

---

### ❌ FRONTEND IMPLEMENTATION (PARTIALLY COMPLETE)

#### Frontend Service
- **Status**: ❌ **MISSING**
- **Location**: Should be `frontend/src/services/reports.service.ts` (does not exist)
- **Impact**: Frontend pages cannot call backend APIs

#### Frontend Pages (Exist but use MOCK data)

**Admin Portal**:
- ✅ `frontend/src/views/admin/ReportsPage.vue`
  - Comprehensive analytics dashboard
  - Charts, tables, filters, export buttons
  - **Uses mock data from**: `frontend/src/mocks/admin-reports.mock.ts`

**Laboran Portal**:
- ✅ `frontend/src/views/laboran/ReportsPage.vue`
  - Simplified operational reports view
  - Utilization breakdown, export buttons
  - **Uses hardcoded mock data** (embedded in component)

#### Router Configuration
- ✅ **Admin route registered**: `/admin/reports` → `AdminReports`
- ✅ **Laboran route registered**: `/laboran/reports` → `LaboranReports`

#### Mock Data Analysis

**Admin Mock Data** (`frontend/src/mocks/admin-reports.mock.ts`):
```typescript
mockReportMetrics[]          // 4 summary cards (Total Hours, Sessions, Requests, Utilization)
mockDailyTrendPoints[]       // 7 days x {label, hours, sessions}
mockLabComparisons[]         // 5 labs x {rank, labName, labCode, hours, sessions, percentage}
mockRequestStatusStats[]     // 3 statuses x {label, count, percentage, color}
mockUsageStatusStats[]       // 4 statuses x {label, count, percentage, color}
mockDetailedReportRows[]     // 6 usage log rows x {id, date, labName, activityName, status, etc.}
```

**Laboran Mock Data** (hardcoded in component):
- 4 summary cards (Total Sessions, Total Hours, Avg Utilization, Most Used Lab)
- 4 laboratory utilization rows (LAB-KOM-A, LAB-KOM-B, LAB-MM, LAB-JAR)

---

## UI/UX ANALYSIS

### Admin ReportsPage Features

**Polished, production-ready UI** with:
1. ✅ **Summary Metrics Row** (4 cards: Total Hours, Sessions, Requests, Utilization)
2. ✅ **Filter Controls Bar** (Period, Laboratory, Custom Date Range)
3. ✅ **Line Chart**: Daily usage trend (SVG-based, interactive hover tooltips)
4. ✅ **Bar Chart**: Usage by laboratory (horizontal bars with percentages)
5. ✅ **Status Distribution Cards**: Request status + Usage status pie charts
6. ✅ **Most Used Labs Ranking** (Top 5 with rank badges)
7. ✅ **Operational Insights Card** (AI-style summary bullets)
8. ✅ **Detailed Usage Table**: Paginated, sortable, filterable
9. ✅ **Export Button**: "Export Report" CTA (shows success toast)
10. ✅ **Responsive Design**: Mobile-friendly grid layouts

**Design System**: Matches existing LabDisplay aesthetic:
- Colors: `dark-green` (#657E47), `brand-100/200`, white, surface
- Typography: Font weights (bold, extrabold), mono for codes/times
- Components: Rounded cards (`rounded-2xl`), shadows (`shadow-2xs`), icons from `lucide-vue-next`
- Consistent with: `DashboardPage.vue`, `RoomUsagePage.vue`, etc.

### Laboran ReportsPage Features

**Simplified operational view** with:
1. ✅ **4 Summary Cards** (Sessions, Hours, Utilization, Most Used Lab)
2. ✅ **Period Selector** (Week/Month/Semester dropdown)
3. ✅ **Lab Utilization Breakdown** (List of labs with session counts, hours, rates)
4. ✅ **Export Buttons** (Export Excel, Export PDF)
5. ✅ **Toast Notification** (Success feedback on export)

---

## GAPS & MISSING PIECES

### 🔴 Critical Gaps

1. **No Reports Service** (`frontend/src/services/reports.service.ts`)
   - Cannot call backend APIs
   - No API methods defined

2. **No Real Data Integration**
   - Admin page uses `admin-reports.mock.ts`
   - Laboran page uses hardcoded mock data
   - All UI interactions are simulated

3. **Backend Authorization Unclear for Laboran**
   - Backend only has `@Roles('ADMIN')`
   - Laboran portal has `/laboran/reports` route
   - Need to verify if Laboran role should access reports

### 🟡 Minor Gaps

4. **Filter Parameters Mismatch**
   - Frontend filters: `selectedPeriod` ('today', 'week', 'month', 'semester', 'custom')
   - Backend expects: ISO date strings (`start_date`, `end_date`)
   - Need to map frontend period selections to actual date ranges

5. **Pagination Not Implemented**
   - Frontend table shows "1 of 1" page (static)
   - Backend supports `page` and `limit` parameters
   - Need to wire up pagination controls

6. **Export Functionality**
   - Frontend export buttons show success toast (fake)
   - No actual file download/generation
   - Need to implement CSV/Excel/PDF export (or remove if out of scope)

7. **Chart Data Mapping**
   - Frontend expects specific chart data structures (e.g., `mockDailyTrendPoints`)
   - Backend returns raw database rows
   - Need to transform backend responses to match chart requirements

---

## EXISTING PROJECT PATTERNS (FOR CONSISTENCY)

### Reference Service Implementation
**File**: `frontend/src/services/room-usage.service.ts`

```typescript
import { http } from './http.service'

interface RoomUsagePayload { ... }
interface RoomUsage { ... }

export const roomUsageService = {
  async getRoomUsages(params?: { page?: number; limit?: number; ... }) {
    const response = await http.get<ApiResponse<PaginatedResponse<RoomUsage>>>(
      '/room-usage',
      { params }
    )
    return response.data
  },

  async getRoomUsageById(id: string) {
    const response = await http.get<ApiResponse<RoomUsage>>(`/room-usage/${id}`)
    return response.data
  },
  
  // ... other methods
}
```

**Key Patterns**:
- Import `http` from `./http.service` (Axios instance with interceptors)
- Use `ApiResponse<T>` wrapper type
- Access nested data: `response.data.data` (for lists) or `response.data.data.data` (for paginated)
- Use `params` object for query strings
- All methods are `async`

### Reference Page Implementation
**File**: `frontend/src/views/admin/RoomUsagePage.vue`

```typescript
import { roomUsageService } from '@/services/room-usage.service'

const isLoading = ref(false)
const roomUsages = ref<RoomUsage[]>([])
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 })

const loadRoomUsages = async () => {
  try {
    isLoading.value = true
    const response = await roomUsageService.getRoomUsages({
      page: pagination.value.page,
      limit: pagination.value.limit,
      // ... other filters
    })
    roomUsages.value = response.data.data        // Array of items
    pagination.value = response.data.meta        // Pagination metadata
  } catch (error) {
    console.error('Failed to load room usages:', error)
    toast.error('Failed to load data')
  } finally {
    isLoading.value = false
  }
}
```

**Key Patterns**:
- Use `ref()` for reactive state
- Loading spinner: `isLoading` flag
- Error handling: try-catch with toast notifications
- Pagination: separate `meta` object
- Call service method in `onMounted()` or watch filters

---

## RECOMMENDED APPROACH

### Option A: Full Integration (Recommended)

**Steps**:
1. ✅ Create `frontend/src/services/reports.service.ts`
2. ✅ Implement 5 API methods matching backend endpoints
3. ✅ Update `AdminReportsPage.vue` to use real API
4. ✅ Update `LaboranReportsPage.vue` to use real API
5. ✅ Add loading states, error handling, empty states
6. ✅ Test all filters, pagination, date range selection
7. ✅ Verify authorization (ADMIN + Laboran access)
8. ⚠️ **Export feature**: Either implement OR disable/hide buttons (TBD with user)

**Timeline**: ~2-3 hours of focused work

**Risk**: Low (backend is ready, UI is ready, just needs wiring)

### Option B: Admin-Only Integration (Minimal)

**Steps**:
1. ✅ Create reports service (same as Option A)
2. ✅ Update Admin ReportsPage only
3. ❌ Leave Laboran ReportsPage with mock data (temporary)

**Timeline**: ~1.5 hours

**Risk**: Lower (smaller scope), but leaves Laboran page incomplete

### Option C: Backend-Only Verification (Diagnostic)

**Steps**:
1. ✅ Test backend endpoints with Postman/curl
2. ✅ Verify data correctness, pagination, filters
3. ⏸️ No frontend changes

**Timeline**: ~30 minutes

**Risk**: Lowest, but doesn't deliver user-facing functionality

---

## DECISION GATE: USER INPUT REQUIRED

Before proceeding to Phase 2 (Implementation), please confirm:

### 1. **Scope Confirmation**
   - Should I integrate **both Admin and Laboran** Reports pages? (Option A)
   - Or should I do **Admin only** first? (Option B)

### 2. **Export Functionality**
   - Do you want me to implement **real export** (CSV/Excel/PDF generation)?
   - Or should I **disable export buttons** for now (focus on viewing reports only)?
   - Or should I keep the **mock export toast** (fake feedback)?

### 3. **Backend Authorization**
   - Should **Laboran role** have access to reports endpoints?
   - Currently backend is `@Roles('ADMIN')` only
   - Frontend has `/laboran/reports` route — should this be accessible?

### 4. **Chart Complexity**
   - The Admin page has a **custom SVG line chart** (Daily Usage Trend)
   - Should I keep this chart and map real data to it?
   - Or simplify the UI to use a simpler chart library (e.g., Chart.js)?

---

## PROPOSED IMPLEMENTATION PLAN (PHASE 2)

**Assuming Option A (Full Integration) is approved:**

### Step 1: Create Reports Service (30 min)
- File: `frontend/src/services/reports.service.ts`
- Methods:
  - `getUsageReport(filters: ReportFilterDto)`
  - `getRequestReport(filters: ReportFilterDto)`
  - `getScheduleReport(filters: ReportFilterDto)`
  - `getLaboratoryReport(filters: ReportFilterDto)`
  - `getSummaryReport(filters: ReportFilterDto)`

### Step 2: Update Admin ReportsPage (60 min)
- Replace `mockReportMetrics` with `getSummaryReport()`
- Replace `mockDetailedReportRows` with `getUsageReport()` (paginated)
- Replace `mockLabComparisons` with `getLaboratoryReport()`
- Replace `mockRequestStatusStats` / `mockUsageStatusStats` with status aggregation from summary
- Map period selections to date ranges
- Add loading states
- Add error handling
- Wire up pagination

### Step 3: Update Laboran ReportsPage (30 min)
- Replace hardcoded mock data with real API calls
- Use same report service methods
- Add loading states
- Add error handling

### Step 4: Test & Verify (30 min)
- Test all filter combinations
- Test pagination
- Test authorization (Admin vs Laboran)
- Verify data accuracy
- Check empty states
- Verify TypeScript compilation

### Step 5: (Optional) Export Implementation (60+ min)
- If approved: Implement backend CSV/PDF generation
- If not: Hide or disable export buttons

---

## NEXT ACTIONS

**✋ WAITING FOR USER DECISION**

Please review the above audit findings and answer the 4 questions in the "Decision Gate" section. Once you confirm:

1. **Scope** (Admin-only or Admin+Laboran)
2. **Export** (Implement, Disable, or Keep Fake)
3. **Authorization** (Laboran access yes/no)
4. **Charts** (Keep SVG or Simplify)

I will proceed immediately with **Phase 2: Implementation** using the approved plan.

---

## AUDIT COMPLETION CHECKLIST

- ✅ Read all backend files (controller, service, DTOs, module)
- ✅ Verified backend module registration in `app.module.ts`
- ✅ Read Prisma schema for data models
- ✅ Read both frontend Reports pages (Admin + Laboran)
- ✅ Read router configuration (routes registered)
- ✅ Analyzed mock data structures
- ✅ Checked for existing reports service (not found)
- ✅ Reviewed reference implementations (room-usage service/page)
- ✅ Identified gaps and missing pieces
- ✅ Documented UI/UX features
- ✅ Proposed implementation plan

**Status**: ✅ **AUDIT COMPLETE — READY FOR PHASE 2**

