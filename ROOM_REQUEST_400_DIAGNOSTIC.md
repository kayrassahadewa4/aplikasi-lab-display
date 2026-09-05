# Room Request HTTP 400 Error - Diagnostic Analysis

**Date:** 2026-08-15  
**Status:** ROOT CAUSE ANALYSIS IN PROGRESS

---

## BACKEND DTO REQUIREMENTS

### CreateRoomRequestDto Fields (ALL REQUIRED except optional ones)

| Field | Type | Required | Validation | Example |
|-------|------|----------|------------|---------|
| `applicant_id` | string | ✅ YES | UUID | `"aa0e8400-e29b-41d4-a716-446655440001"` |
| `laboratory_id` | string | ✅ YES | UUID | `"cc0e8400-e29b-41d4-a716-446655440007"` |
| `activity_name` | string | ✅ YES | MaxLength(100) | `"Programming Workshop"` |
| `course_name` | string | ❌ OPTIONAL | MaxLength(100) | `"Web Development"` |
| `class_name` | string | ❌ OPTIONAL | MaxLength(30) | `"CS-A1"` |
| `description` | string | ✅ YES | Not empty | `"Workshop description"` |
| `request_date` | string | ✅ YES | ISO 8601 Date | `"2024-02-15"` |
| `start_time` | string | ✅ YES | HH:mm:ss | `"09:00:00"` |
| `end_time` | string | ✅ YES | HH:mm:ss | `"12:00:00"` |
| `participant_count` | number | ✅ YES | Integer, Min(1) | `25` |
| `status` | RequestStatus | ✅ YES | Enum(PENDING, APPROVED, REJECTED, CANCELLED) | `"PENDING"` |

---

## FRONTEND PAYLOAD MAPPING

### mapCreateToBackend Function Output

```typescript
{
  applicant_id: payload.applicantId,          // ✅ Mapped
  laboratory_id: payload.laboratoryId,        // ✅ Mapped
  activity_name: payload.activityName,        // ✅ Mapped
  course_name: payload.courseName || null,    // ✅ Mapped (optional)
  class_name: payload.className || null,      // ✅ Mapped (optional)
  description: payload.description,           // ✅ Mapped
  request_date: payload.requestDate,          // ✅ Mapped (YYYY-MM-DD)
  start_time: toBackendTime(payload.startTime), // ✅ Mapped (HH:mm → HH:mm:ss)
  end_time: toBackendTime(payload.endTime),   // ✅ Mapped (HH:mm → HH:mm:ss)
  participant_count: payload.participantCount, // ✅ Mapped
  status: payload.status || 'PENDING',        // ✅ Mapped (defaults to PENDING)
}
```

---

## BACKEND VALIDATION RULES (12 Rules)

### DTO Validation (class-validator)
1. ✅ All required fields present
2. ✅ Field types correct
3. ✅ String maxLength constraints
4. ✅ participant_count >= 1
5. ✅ status is valid enum value
6. ✅ request_date is ISO 8601 format
7. ✅ Times are strings (HH:mm:ss format)

### Business Logic Validation (service layer)
1. **RULE 1:** Applicant exists (user ID validation)
2. **RULE 2:** Laboratory exists
3. **RULE 3:** Active academic calendar exists
4. **RULE 4:** Laboratory not CLOSED or MAINTENANCE
5. **RULE 5:** Operational hours exist for the day
6. **RULE 6:** Start time < End time (handles midnight)
7. **RULE 7:** Request date within academic calendar range
8. **RULE 8:** No duplicate request (same applicant, lab, date, time)
9. **RULE 9:** No conflict with approved requests
10. **RULE 10:** No conflict with schedules
11. **RULE 11:** Participant count <= laboratory capacity
12. **RULE 12:** Request time within operational hours

---

## AUTHORIZATION CHECK

### Controller Role Requirement
```typescript
@Post()
@Roles('DOSEN')  // ⚠️ ONLY DOSEN ROLE CAN CREATE
```

**CRITICAL:** The create endpoint requires the authenticated user to have the `DOSEN` role!

### Possible Authorization Issues
1. ❌ Admin user trying to create without DOSEN role → HTTP 403 Forbidden (not 400)
2. ❌ User token doesn't have DOSEN in roles array → HTTP 403 Forbidden (not 400)
3. ✅ If getting 400, authorization passed (user has DOSEN role)

---

## LIKELY ROOT CAUSES (PRIORITIZED)

### Priority 1: Time Format Issue
**Hypothesis:** `toBackendTime()` function might not be working correctly

**Test:**
- Input: `"08:00"`
- Expected output: `"08:00:00"`
- Need to verify actual output

**Code:**
```typescript
function toBackendTime(timeStr: string): string {
  if (!timeStr) return ''
  if (timeStr.length === 8 && timeStr.split(':').length === 3) {
    return timeStr  // Already HH:mm:ss
  }
  if (timeStr.length === 5 && timeStr.split(':').length === 2) {
    return `${timeStr}:00`  // Convert HH:mm → HH:mm:ss
  }
  return timeStr
}
```

### Priority 2: Business Validation Failure
**Possible failures:**
1. ❌ No active academic calendar
2. ❌ Request date outside academic calendar range
3. ❌ No operational hours for laboratory on that day
4. ❌ Laboratory is CLOSED or MAINTENANCE
5. ❌ Applicant ID doesn't exist
6. ❌ Laboratory ID doesn't exist
7. ❌ Time outside operational hours

### Priority 3: Date Format Issue
**Hypothesis:** `request_date` might not be in correct ISO 8601 format

**Test:**
- Input: `"2026-08-20"`
- Expected: Valid ISO 8601 date
- Backend uses: `new Date(createRoomRequestDto.request_date)`

### Priority 4: Status Enum Issue
**Hypothesis:** Status string might not match enum exactly

**Test:**
- Frontend sends: `"PENDING"` (string)
- Backend expects: `RequestStatus.PENDING`
- Enum values: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`

---

## ERROR INTERCEPTION ISSUE

### Current Problem
The frontend error interceptor doesn't extract the backend error message:

```typescript
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle 401
    }
    return Promise.reject(error)  // ⚠️ Returns raw error
  }
)
```

### Frontend Error Display
```typescript
catch (error: any) {
  errorMessage.value = error.message || 'Failed to create room request'
  // error.message is generic Axios message, not backend message
}
```

### Backend Error Response Structure
Backend likely returns:
```json
{
  "statusCode": 400,
  "message": "Actual validation error message",
  "error": "Bad Request"
}
```

But frontend only shows: `"Request failed with status code 400"`

---

## NEXT STEPS

### Step 1: Check Browser Network Tab
Manually inspect the actual HTTP request and response:
1. Open browser DevTools
2. Go to Network tab
3. Try to create a room request
4. Find the POST request to `/room-requests`
5. Check:
   - Request payload
   - Response body
   - Response headers

### Step 2: Verify Backend Error Message
Extract the actual backend error message from `error.response.data.message`

### Step 3: Fix Root Cause
Based on actual error message, apply minimal fix

### Step 4: Improve Error Display
Update error handling to show backend message

---

## SUSPECTED ISSUES TO VERIFY

### Issue 1: Empty/Undefined Fields
- ✅ `applicantId` - Loaded from auth
- ✅ `laboratoryId` - Selected from dropdown
- ❓ `description` - Uses fallback `'Room request'` if empty

### Issue 2: Invalid UUID Format
- Need to verify `applicantId` and `laboratoryId` are valid UUIDs

### Issue 3: Time Conversion
- Need to verify `toBackendTime("08:00")` returns `"08:00:00"`

### Issue 4: Business Rules
- Need to verify active academic calendar exists
- Need to verify operational hours exist
- Need to verify laboratory is available

---

## RECOMMENDATION

**DO NOT MODIFY CODE YET**

Instead, ask user to:
1. Open browser DevTools → Network tab
2. Try to create a room request
3. Find the POST request to `/api/v1/room-requests`
4. Copy the exact error response body

This will give us the ACTUAL backend error message and root cause.

---

**Status:** Awaiting actual backend error message from Network tab
