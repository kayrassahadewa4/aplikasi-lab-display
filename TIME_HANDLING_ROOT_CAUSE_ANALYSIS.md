# TIME HANDLING ROOT CAUSE ANALYSIS

## INVESTIGATION COMPLETED

**Date**: 2026-08-15  
**Issue**: Backend validation rejecting legitimate operational hours and schedules

---

## ROOT CAUSE IDENTIFIED

### PRIMARY ISSUE: Operational Hours Validation Forbids Midnight-Ending Intervals

**File**: `backend/src/modules/operational-hour/operational-hour.service.ts`  
**Line**: 55-58

```typescript
if (this.compareTime(closeTime, openTime) <= 0) {
  throw new BadRequestException(
    'Close time must be later than open time',
  );
}
```

**Problem**: This validation **REJECTS** midnight-ending operational hours like `15:00:00 → 00:00:00` because numerically `00:00 < 15:00`.

**Business Impact**: Indonesian laboratories that operate afternoon/evening shifts (e.g., 03 PM → 12 AM) cannot be configured in the system.

---

### SECONDARY ISSUE: Schedule Validation Doesn't Handle Midnight-Crossing Operational Hours

**File**: `backend/src/modules/schedule/schedule.service.ts`  
**Lines**: 121-147

The validation logic in `validateOperationalHour()` assumes operational hours are same-day intervals:

```typescript
const scheduleStart = this.compareTime(startTime, operationalHour.open_time);
const scheduleEnd = this.compareTime(endTime, operationalHour.close_time);
const startBeforeClose = this.compareTime(startTime, operationalHour.close_time);
const endAfterOpen = this.compareTime(endTime, operationalHour.open_time);

if (
  scheduleStart < 0 ||      // start_time before open_time
  scheduleEnd > 0 ||        // end_time after close_time
  startBeforeClose >= 0 ||  // start_time >= close_time
  endAfterOpen <= 0         // end_time <= open_time
) {
  throw new BadRequestException(...);
}
```

**Problem**: When `close_time = 00:00:00`, the conditions `startBeforeClose >= 0` and `endAfterOpen <= 0` will incorrectly reject valid schedules.

---

## WHAT IS NOT THE PROBLEM

✅ **Timezone Handling**: No UTC conversion issues found. Backend properly uses JavaScript Date with `setHours()` which operates in local time.

✅ **Database Representation**: PostgreSQL `TIME(6)` type is correct for time-of-day values.

✅ **Frontend Time Format**: HTML5 `<input type="time">` correctly provides HH:mm format without timezone complications.

✅ **Time Conversion Utilities**: Both frontend and backend properly convert between HH:mm and HH:mm:ss formats.

✅ **Frontend Services**: `schedule.service.ts` and `operational-hour.service.ts` correctly handle time extraction and formatting.

---

## DETAILED INSPECTION RESULTS

### Backend - Prisma Schema
```prisma
model OperationalHour {
  open_time     DateTime @db.Time(6)
  close_time    DateTime @db.Time(6)
}

model Schedule {
  start_time    DateTime @db.Time(6)
  end_time      DateTime @db.Time(6)
}
```

**Finding**: PostgreSQL TIME type stores time-of-day without timezone information. ✅ CORRECT

---

### Backend - DTOs

**Operational Hour DTOs**:
- Request: `open_time: string` (HH:mm:ss format)
- Response: `open_time: Date` (parsed from database)

**Schedule DTOs**:
- Request: `start_time: string` (HH:mm:ss format)
- Response: `start_time: Date` (parsed from database)

**Finding**: DTO contracts are correct. ✅

---

### Backend - Time Parsing

```typescript
private parseTime(timeString: string): Date {
  const [hours, minutes, seconds] = timeString.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, seconds || 0, 0);
  return date;
}
```

**Finding**: Uses local time via `setHours()`, no UTC conversion. ✅ CORRECT

---

### Backend - Time Comparison

```typescript
private compareTime(time1: Date, time2: Date): number {
  const hours1 = time1.getHours();
  const minutes1 = time1.getMinutes();
  const seconds1 = time1.getSeconds();
  
  const hours2 = time2.getHours();
  const minutes2 = time2.getMinutes();
  const seconds2 = time2.getSeconds();
  
  const totalSeconds1 = hours1 * 3600 + minutes1 * 60 + seconds1;
  const totalSeconds2 = hours2 * 3600 + minutes2 * 60 + seconds2;
  
  return totalSeconds1 - totalSeconds2;
}
```

**Finding**: Pure numeric comparison of time-of-day. ✅ CORRECT

---

### Frontend - Time Input

```vue
<input
  v-model="form.openTime"
  type="time"
  required
  class="..."
/>
```

**Finding**: HTML5 time input provides HH:mm in local time. No timezone complications. ✅ CORRECT

---

### Frontend - Time Extraction

```typescript
function extractTimeString(dateValue: Date | string): string {
  if (typeof dateValue === 'string') {
    if (dateValue.includes('T')) {
      return dateValue.substring(11, 16) // Extract HH:mm from ISO
    } else if (dateValue.includes(':')) {
      return dateValue.substring(0, 5) // Extract HH:mm from HH:mm:ss
    }
  } else {
    const hours = dateValue.getHours().toString().padStart(2, '0')
    const minutes = dateValue.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }
  return '00:00'
}
```

**Finding**: Correctly extracts HH:mm without timezone conversion. ✅ CORRECT

---

### Frontend - Time Conversion to Backend

```typescript
// operational-hour.service.ts
open_time: `${data.openTime}:00`, // Convert HH:mm to HH:mm:ss
close_time: `${data.closeTime}:00`,

// schedule.service.ts
start_time: `${data.startTime}:00`, // Convert HH:mm to HH:mm:ss
end_time: `${data.endTime}:00`,
```

**Finding**: Simple string concatenation, no Date/timezone operations. ✅ CORRECT

---

## VALIDATION TEST MATRIX

### Current Backend Behavior

| Operational Hours | Backend Validation | Result |
|-------------------|-------------------|---------|
| 08:00 → 17:00 | `closeTime > openTime` | ✅ PASS |
| 15:00 → 00:00 | `closeTime (0) <= openTime (15)` | ❌ **FAIL** - "Close time must be later than open time" |

| Operational Hours | Schedule | Current Validation | Result |
|-------------------|----------|-------------------|---------|
| 08:00 → 17:00 | 08:00 → 10:00 | Normal interval logic | ✅ PASS |
| 08:00 → 17:00 | 16:00 → 18:00 | Ends after close_time | ❌ FAIL (correct) |
| 15:00 → 00:00 | 15:00 → 17:00 | Assumes same-day interval | ❌ **FAIL** (incorrect - should pass) |

---

## REQUIRED FIXES

### 1. Operational Hours Service

**Allow midnight-ending intervals** while preventing invalid configurations.

Valid:
- `08:00 → 17:00` (normal same-day)
- `15:00 → 00:00` (ends at midnight)

Invalid:
- `17:00 → 08:00` (overnight, not supported by business rules)
- `00:00 → 00:00` (zero duration)
- `08:00 → 08:00` (zero duration)

### 2. Schedule Service

**Handle midnight-ending operational hours correctly**.

When operational hours are `15:00 → 00:00`:
- Schedule `15:00 → 17:00` should PASS
- Schedule `22:00 → 23:30` should PASS
- Schedule `23:00 → 00:00` should PASS (if business rules allow)
- Schedule `14:00 → 16:00` should FAIL (starts before open)
- Schedule `23:00 → 01:00` should FAIL (ends after midnight)

---

## IMPLEMENTATION PLAN

1. ✅ **Identify root cause** - COMPLETE
2. ⏳ **Fix operational hours validation** - Allow `close_time = 00:00:00` as special case for midnight-ending
3. ⏳ **Fix schedule validation** - Detect midnight-ending operational hours and adjust validation logic
4. ⏳ **Add validation tests** - Ensure all test matrix cases pass
5. ⏳ **Verify no regression** - Ensure normal same-day intervals still work correctly

---

## CONCLUSION

The time handling system is fundamentally sound. The issue is purely **business logic validation** that doesn't account for legitimate midnight-ending operational hours. No timezone fixes, Date conversions, or frontend changes are needed.

**Action**: Update backend validation logic to support midnight-ending operational hours (00:00:00 as close_time).
