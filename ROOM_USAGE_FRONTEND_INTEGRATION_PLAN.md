# ROOM USAGE FRONTEND INTEGRATION - EXECUTION PLAN

**Date**: August 16, 2026  
**Status**: 🔄 **IN PROGRESS**  
**Phase**: Frontend Page Integration (Phase 2)

---

## CURRENT STATE ASSESSMENT

### ✅ COMPLETED (Phase 1)

1. **Backend Authorization**: ✅ Complete
   - ADMIN + LABORAN can create/update room usage
   - All endpoints properly authorized
   
2. **Frontend Service Layer**: ✅ Complete
   - `frontend/src/services/room-usage.service.ts` created
   - Response structure mapping correct (`response.data.data`)
   - Query parameters validated
   - TypeScript interfaces complete
   - Sugar methods implemented
   - No diagnostics errors

3. **Service Export**: ✅ Complete
   - Added to `frontend/src/services/index.ts`

### ⚠️ PARTIALLY COMPLETE

4. **Admin RoomUsagePage.vue**: ✅ **FULLY INTEGRATED**
   - Already imports and uses `roomUsageService`
   - Loads data from API correctly
   - Pagination works
   - Filters work
   - No diagnostics errors
   - **STATUS**: Complete, no changes needed

5. **Admin RoomUsageDetailPage.vue**: ✅ **FULLY INTEGRATED**
   - Already imports and uses `roomUsageService`
   - Loads usage by ID
   - Check-out functionality integrated
   - Delete functionality integrated
   - No diagnostics errors
   - **STATUS**: Complete, needs minor fix for auth user ID

6. **Admin RoomUsageFormPage.vue**: ⚠️ **NEEDS FIXES**
   - Service imported and used
   - Load/save logic present
   - **ISSUES**:
     - Form fields don't match backend requirements
     - Missing laboratory selection integration
     - Form references non-existent fields (className, checkedInByName, etc.)
     - Template has fields that aren't in form state
   - No diagnostics errors (but runtime issues will occur)
   - **STATUS**: Needs field mapping fixes

### ❌ NOT STARTED

7. **Laboran RoomUsagePage.vue**: ❌ **USES MOCK DATA**
   - Still imports from `@/mocks/admin-room-usage.mock`
   - Needs complete service integration
   - **STATUS**: Needs integration

8. **Laboran RoomUsageDetailPage.vue**: ❌ **USES MOCK DATA**
   - Still imports from `@/mocks/admin-room-usage.mock`
   - Needs complete service integration
   - **STATUS**: Needs integration

---

## INTEGRATION ISSUES IDENTIFIED

### Issue #1: Form Page Field Mapping

**File**: `frontend/src/views/admin/RoomUsageFormPage.vue`

**Problem**:
- Form state only has: `activityName`, `requestId`, `scheduleId`, `status`, `notes`
- Template references: `className`, `checkedInByName`, `checkedInByEmail`, `laboratoryCode`
- Backend requires: `requestId` OR `scheduleId`, `checkedInBy`, `checkInTime`, `status`

**Impact**: Form will not work correctly - fields in template don't exist in form state

**Solution Required**:
1. Fix form state to match service requirements
2. Remove or hide fields that don't map to create/update payloads
3. Ensure `checkedInBy` uses authenticated user ID
4. Ensure either `requestId` or `scheduleId` is provided

### Issue #2: Laboran Pages Use Mock Data

**Files**:
- `frontend/src/views/laboran/RoomUsagePage.vue`
- `frontend/src/views/laboran/RoomUsageDetailPage.vue`

**Problem**:
- Still import and use mock data functions
- Not connected to API

**Impact**: Laboran users see fake data, cannot perform real operations

**Solution Required**:
1. Replace mock imports with service imports
2. Replace mock function calls with service method calls
3. Update data structures to match service interfaces
4. Test check-in/check-out functionality

### Issue #3: Auth User ID in Check-out

**File**: `frontend/src/views/admin/RoomUsageDetailPage.vue` (line 62)

**Problem**:
```typescript
await roomUsageService.checkOut(usgId, 'current-user-id')
```
Uses hardcoded string instead of actual authenticated user ID

**Impact**: Check-out will fail or use wrong user ID

**Solution Required**:
```typescript
import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore()
await roomUsageService.checkOut(usgId, authStore.user!.id)
```

---

## BACKEND CONTRACT REFERENCE

### POST /room-usage (Create/Check-in)

**Required Fields**:
```typescript
{
  request_id?: string,      // Optional: from approved room request
  schedule_id?: string,     // Optional: from schedule
  checked_in_by: string,    // Required: user ID
  check_in_time: string,    // Required: ISO 8601 timestamp
  status: 'CHECKED_IN' | 'IN_USE',  // Required
  notes?: string            // Optional
}
```

**Business Rules**:
- Either `request_id` OR `schedule_id` must be provided (at least one)
- If using `request_id`, request must be APPROVED
- Laboratory must be AVAILABLE or IN_USE
- User must exist

### PATCH /room-usage/:id (Update/Check-out)

**Optional Fields**:
```typescript
{
  checked_out_by?: string,
  check_out_time?: string,  // ISO 8601
  status?: 'IN_USE' | 'CHECKED_OUT' | 'CANCELLED',
  notes?: string
}
```

**Status Transitions**:
```
CHECKED_IN → [IN_USE, CANCELLED]
IN_USE → [CHECKED_OUT, CANCELLED]
CHECKED_OUT → [] (terminal)
CANCELLED → [] (terminal)
```

---

## IMPLEMENTATION TASKS

### Task 1: Fix Admin RoomUsageFormPage.vue ✅ HIGH PRIORITY

**Estimated effort**: 30 minutes

**Changes needed**:

1. **Update form state** to remove invalid fields:
```typescript
const form = ref({
  requestId: '',
  scheduleId: '',
  status: 'CHECKED_IN' as 'CHECKED_IN' | 'IN_USE',
  notes: '',
})
```

2. **Update template** to match form state:
   - Remove or replace `className` field
   - Remove `checkedInByName` and `checkedInByEmail` fields (use auth user)
   - Add room request selector or schedule selector
   - Simplify to essential fields only

3. **Update save handler** to use auth user:
```typescript
import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore()

const payload: CreateRoomUsagePayload = {
  requestId: form.value.requestId || undefined,
  scheduleId: form.value.scheduleId || undefined,
  checkedInBy: authStore.user!.id,  // Use authenticated user
  checkInTime: new Date().toISOString(),
  status: form.value.status,
  notes: form.value.notes || undefined,
}
```

4. **Add validation**:
   - Ensure either requestId or scheduleId is provided
   - Validate status is valid for creation

### Task 2: Fix Admin RoomUsageDetailPage.vue ✅ HIGH PRIORITY

**Estimated effort**: 5 minutes

**Changes needed**:

1. **Import auth store**:
```typescript
import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore()
```

2. **Update check-out handler** (line ~62):
```typescript
await roomUsageService.checkOut(usgId, authStore.user!.id)
```

### Task 3: Integrate Laboran RoomUsagePage.vue 📋 MEDIUM PRIORITY

**Estimated effort**: 45 minutes

**Changes needed**:

1. **Replace mock imports** with service imports:
```typescript
// Remove:
import { mockRoomUsageList, checkInRoomUsage, checkOutRoomUsage, type RoomUsageData } from '@/mocks/admin-room-usage.mock'

// Add:
import { roomUsageService, type RoomUsage } from '@/services/room-usage.service'
import { useAuthStore } from '@/stores/auth.store'
```

2. **Update data types**:
```typescript
const usageList = ref<RoomUsage[]>([])  // Change from RoomUsageData[]
const authStore = useAuthStore()
```

3. **Replace data loading**:
```typescript
const loadRoomUsages = async () => {
  isLoading.value = true
  try {
    const response = await roomUsageService.getRoomUsages({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value.trim() || undefined,
      status: selectedStatusFilter.value !== 'ALL' ? selectedStatusFilter.value : undefined,
    })
    usageList.value = response.data
    // Update computed values as needed
  } catch (error: any) {
    console.error('Failed to load room usages:', error)
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}
```

4. **Update check-in handler**:
```typescript
const handleConfirmCheckIn = async () => {
  if (!checkInTarget.value) return
  isActionLoading.value = true
  try {
    await roomUsageService.markInUse(checkInTarget.value.id)
    checkInTarget.value = null
    await loadRoomUsages()  // Reload data
    triggerToast('Check-in confirmed successfully.')
  } catch (error: any) {
    console.error('Failed to check in:', error)
    triggerToast(error.message || 'Check-in failed')
  } finally {
    isActionLoading.value = false
  }
}
```

5. **Update check-out handler**:
```typescript
const handleConfirmCheckOut = async () => {
  if (!checkOutTarget.value) return
  isActionLoading.value = true
  try {
    await roomUsageService.updateRoomUsage(checkOutTarget.value.id, {
      checkedOutBy: authStore.user!.id,
      checkOutTime: new Date().toISOString(),
      status: 'CHECKED_OUT',
      notes: checkOutNotes.value.trim() || undefined,
    })
    checkOutTarget.value = null
    checkOutNotes.value = ''
    await loadRoomUsages()  // Reload data
    triggerToast('Check-out completed successfully.')
  } catch (error: any) {
    console.error('Failed to check out:', error)
    triggerToast(error.message || 'Check-out failed')
  } finally {
    isActionLoading.value = false
  }
}
```

6. **Update template field references**:
   - Change `RoomUsageData` references to `RoomUsage`
   - Update field names if needed (check service interface)

### Task 4: Integrate Laboran RoomUsageDetailPage.vue 📋 MEDIUM PRIORITY

**Estimated effort**: 30 minutes

**Changes needed**:

1. **Replace mock imports** with service imports:
```typescript
// Remove:
import { getRoomUsageById, checkOutRoomUsage, checkInRoomUsage, mockRoomUsageList, type RoomUsageData } from '@/mocks/admin-room-usage.mock'

// Add:
import { roomUsageService, type RoomUsage } from '@/services/room-usage.service'
import { useAuthStore } from '@/stores/auth.store'
```

2. **Update data types**:
```typescript
const usageItem = ref<RoomUsage | null>(null)
const authStore = useAuthStore()
```

3. **Replace data loading**:
```typescript
const loadUsage = async () => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    usageItem.value = await roomUsageService.getRoomUsageById(usageId.value)
  } catch (error: any) {
    console.error('Failed to load room usage:', error)
    errorMessage.value = error.message || 'Failed to load room usage'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadUsage()
})
```

4. **Update check-in handler**:
```typescript
const confirmCheckIn = async () => {
  if (!usageItem.value) return
  isActionLoading.value = true
  try {
    await roomUsageService.markInUse(usageItem.value.id)
    await loadUsage()  // Reload to get updated data
    triggerToast('Check-in confirmed. Status is now IN_USE.')
  } catch (error: any) {
    console.error('Failed to check in:', error)
    triggerToast(error.message || 'Check-in failed')
  } finally {
    isActionLoading.value = false
  }
}
```

5. **Update check-out handler**:
```typescript
const confirmCheckOut = async () => {
  if (!usageItem.value) return
  isActionLoading.value = true
  try {
    await roomUsageService.updateRoomUsage(usageItem.value.id, {
      checkedOutBy: authStore.user!.id,
      checkOutTime: new Date().toISOString(),
      status: 'CHECKED_OUT',
      notes: checkOutNotes.value.trim() || undefined,
    })
    showCheckOutConfirm.value = false
    checkOutNotes.value = ''
    await loadUsage()  // Reload to get updated data
    triggerToast('Check-out completed successfully.')
  } catch (error: any) {
    console.error('Failed to check out:', error)
    triggerToast(error.message || 'Check-out failed')
  } finally {
    isActionLoading.value = false
  }
}
```

6. **Remove mock fallback**:
```typescript
// Remove this:
onMounted(() => {
  const found = getRoomUsageById(usageId.value)
  if (found) {
    usageItem.value = found
  } else {
    usageItem.value = mockRoomUsageList[0]
  }
})
```

---

## TESTING CHECKLIST

### After Each Task

- [ ] TypeScript validation (no new diagnostics)
- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Forms submit successfully
- [ ] Error messages display correctly
- [ ] Loading states work

### Admin Integration Testing

- [ ] Admin can view room usage list
- [ ] Pagination works
- [ ] Search/filter works
- [ ] Admin can view usage detail
- [ ] Admin can check out a usage
- [ ] Admin can create new usage (manual check-in)
- [ ] Admin can update usage status
- [ ] Admin can delete usage (if allowed)

### Laboran Integration Testing

- [ ] Laboran can view room usage list
- [ ] Active sessions display correctly
- [ ] Upcoming sessions display correctly
- [ ] Completed sessions display correctly
- [ ] Laboran can check in a session
- [ ] Laboran can check out a session
- [ ] Laboran can view usage detail
- [ ] Check-in/check-out updates laboratory status

### Cross-Role Testing

- [ ] ADMIN and LABORAN see same real-time data
- [ ] Operations by ADMIN visible to LABORAN
- [ ] Operations by LABORAN visible to ADMIN
- [ ] No permission errors for authorized operations
- [ ] Proper HTTP 403 for unauthorized operations

---

## EXECUTION PRIORITY

### Priority 1: HIGH (Complete First) 🔴

1. ✅ Fix Admin RoomUsageDetailPage.vue (auth user ID)
2. ✅ Fix Admin RoomUsageFormPage.vue (field mapping)

**Rationale**: Admin pages partially integrated, small fixes needed

### Priority 2: MEDIUM (Complete Second) 🟡

3. 📋 Integrate Laboran RoomUsagePage.vue
4. 📋 Integrate Laboran RoomUsageDetailPage.vue

**Rationale**: Laboran pages completely on mock data, need full integration

### Priority 3: VALIDATION (Complete Third) 🟢

5. ✅ Run TypeScript validation
6. ✅ Manual testing (all roles)
7. ✅ Create final integration report

---

## ESTIMATED TOTAL EFFORT

| Task | Effort | Priority |
|------|--------|----------|
| Fix Admin Detail Page | 5 min | HIGH |
| Fix Admin Form Page | 30 min | HIGH |
| Integrate Laboran List Page | 45 min | MEDIUM |
| Integrate Laboran Detail Page | 30 min | MEDIUM |
| Testing & Validation | 30 min | LOW |
| **TOTAL** | **~2.5 hours** | - |

---

## SUCCESS CRITERIA

### Technical

- ✅ No TypeScript diagnostics errors
- ✅ All pages load without console errors
- ✅ All API calls use correct endpoints
- ✅ Response structures mapped correctly
- ✅ Query parameters validated
- ✅ Error handling implemented

### Functional

- ✅ Admin can fully manage room usage
- ✅ Laboran can fully operate room usage
- ✅ Real-time data synchronization works
- ✅ Check-in/check-out workflows complete
- ✅ Status transitions enforced
- ✅ Laboratory status updates correctly

### Business Rules

- ✅ All 12 backend validation rules enforced
- ✅ Status transitions follow allowed paths
- ✅ Authorization works correctly (ADMIN + LABORAN)
- ✅ DOSEN has no access (as intended)
- ✅ Cannot delete CHECKED_OUT usage

---

## NEXT STEPS

1. **START**: Fix Admin RoomUsageDetailPage.vue (5 min)
2. **THEN**: Fix Admin RoomUsageFormPage.vue (30 min)
3. **THEN**: Integrate Laboran RoomUsagePage.vue (45 min)
4. **THEN**: Integrate Laboran RoomUsageDetailPage.vue (30 min)
5. **FINALLY**: Test and validate all functionality (30 min)

**Total estimated time to completion**: ~2.5 hours

---

**END OF INTEGRATION PLAN**

