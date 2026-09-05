# PHASE 11 PART 3D — HTTP 400 DIAGNOSTIC REPORT
**Date:** August 14, 2026  
**Task:** Diagnostic trace of HTTP 400 on `GET /api/users?role_id=<UUID>&limit=1`  
**Status:** ✅ ROOT CAUSE IDENTIFIED

---

## EXECUTIVE SUMMARY

### ROOT CAUSE: ✅ IDENTIFIED

**The HTTP 400 error is caused by NestJS ValidationPipe rejecting `role_id` as a "non-whitelisted" property.**

**Why:**
- `UserController.findAll()` uses `@Query() paginationDto: PaginationDto`
- `PaginationDto` only defines: `page`, `limit`, `search`
- `PaginationDto` does **NOT** define `role_id` or `status`
- Global ValidationPipe has `forbidNonWhitelisted: true`
- When request includes `role_id=<UUID>`, ValidationPipe rejects it as unknown property
- ValidationPipe throws BadRequestException with validation error details
- HttpExceptionFilter only extracts `.message` = "Bad Request Exception"
- Original detailed validation errors are lost

**The Problem:**
Controller accepts `role_id` via separate `@Query('role_id')` parameter, but ValidationPipe validates query params against `PaginationDto` FIRST, which doesn't include `role_id`.

---

## 1. REQUEST FLOW TRACE

### Frontend Initiation

**File:** `frontend/src/views/admin/RolesPage.vue`  
**Function:** `loadRoles()` (line 42)  
**Call Chain:**
```typescript
loadRoles() 
  → await roleService.getRoles()
```

**File:** `frontend/src/services/role.service.ts`  
**Function:** `getRoles()` (line 159-179)  
**Call Chain:**
```typescript
getRoles()
  → apiClient.get('/roles', { params })  // Fetch roles
  → Promise.all(rolesData.map(role => getUsersCountByRole(role.id)))  // Count users per role
```

**File:** `frontend/src/services/role.service.ts`  
**Function:** `getUsersCountByRole()` (line 165-178)  
**CRITICAL LINE 168:**
```typescript
const response = await apiClient.get('/users', {
  params: { role_id: roleId, limit: 1 },
})
```

**Actual Request Generated:**
```
GET http://localhost:3000/api/users?role_id=85879a77-1ddb-42de-a586-bd3a5dcc08b2&limit=1
Authorization: Bearer <JWT_TOKEN>
```

✅ **Frontend request is CORRECT**

---

## 2. BACKEND RECEPTION

### Controller Layer

**File:** `backend/src/modules/users/user.controller.ts`  
**Method:** `findAll()` (line 110-119)  
**Signature:**
```typescript
async findAll(
  @Query() paginationDto: PaginationDto,        // ← PROBLEM HERE
  @Query('role_id') role_id?: string,
  @Query('status') status?: 'ACTIVE' | 'INACTIVE',
): Promise<PaginatedResponseDto<ResponseUserDto>>
```

**What Happens:**
1. Request arrives: `GET /api/users?role_id=85879a77-1ddb-42de-a586-bd3a5dcc08b2&limit=1`
2. **ValidationPipe runs BEFORE controller method**
3. ValidationPipe tries to validate entire query string against `PaginationDto`
4. Query contains: `{ role_id: "...", limit: 1 }`
5. `PaginationDto` defines: `page`, `limit`, `search`
6. `role_id` is **NOT** in `PaginationDto`
7. **ValidationPipe rejects request**

---

## 3. VALIDATION LAYER (THE FAILURE POINT)

### Global ValidationPipe Configuration

**File:** `backend/src/main.ts`  
**Lines:** 26-34  
**Configuration:**
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                    // ← Strip unknown properties
    forbidNonWhitelisted: true,         // ← THROW ERROR on unknown properties
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Key Settings:**
- `whitelist: true` — Remove properties not in DTO
- `forbidNonWhitelisted: true` — **REJECT request if unknown properties exist**

This is the **EXACT CAUSE** of HTTP 400.

### PaginationDto

**File:** `backend/src/common/dto/pagination.dto.ts`  
**Lines:** 1-32  
**Defined Properties:**
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

**Properties NOT defined:**
- ❌ `role_id`
- ❌ `status`

**Result:** When query contains `role_id`, ValidationPipe sees it as **non-whitelisted** and throws BadRequestException.

---

## 4. EXCEPTION HANDLING LAYER

### ValidationPipe Throws Exception

When ValidationPipe encounters `role_id` in query params:

```typescript
throw new BadRequestException({
  statusCode: 400,
  message: "Bad Request Exception",
  error: [
    {
      property: "role_id",
      constraints: {
        whitelistValidation: "property role_id should not exist"
      }
    }
  ]
})
```

**Note:** The detailed validation errors are in `error` array, not `message`.

### HttpExceptionFilter

**File:** `backend/src/common/filters/http-exception.filter.ts`  
**Lines:** 12-30  
**Code:**
```typescript
const message =
  exception instanceof HttpException
    ? exception.message          // ← ONLY extracts .message
    : 'Internal server error';

response.status(status).json({
  success: false,
  statusCode: status,
  message,                       // ← Only "Bad Request Exception"
  data: null,
});
```

**Problem:** Exception filter only extracts `.message`, losing detailed validation errors.

**ValidationPipe error structure:**
```typescript
{
  message: "Bad Request Exception",  // ← This is extracted
  error: [                          // ← This is LOST
    { property: "role_id", ... }
  ]
}
```

**Result:** Client only receives generic "Bad Request Exception" message.

---

## 5. WHY THIS HAPPENS

### The Architecture Conflict

**Controller Design:**
```typescript
findAll(
  @Query() paginationDto: PaginationDto,  // Validates page, limit, search
  @Query('role_id') role_id?: string,     // Separate parameter
  @Query('status') status?: string        // Separate parameter
)
```

**Intention:** 
- Use `PaginationDto` for common pagination fields
- Use separate `@Query('role_id')` for role filtering
- Use separate `@Query('status')` for status filtering

**Reality:**
- `@Query()` without specific parameter name = **bind ALL query params to DTO**
- ValidationPipe validates **ALL query params** against `PaginationDto`
- `role_id` and `status` are **NOT** in `PaginationDto`
- **ValidationPipe rejects the entire request**

---

## 6. COMPARISON WITH ROLE CONTROLLER

### Why Role Controller Works

**File:** `backend/src/modules/role/role.controller.ts`  
**Method:** `findAll()`  
**Signature:**
```typescript
async findAll(
  @Query() paginationDto: PaginationDto,
): Promise<PaginatedResponseDto<ResponseRoleDto>> {
  const { page, limit, search } = paginationDto;
  return this.roleService.findAll(page, limit, search);
}
```

**Query:** `GET /api/roles?page=1&limit=100`  
**Parameters:** `page`, `limit` (both in `PaginationDto`)  
**Result:** ✅ Works perfectly

### Why User Controller Fails

**File:** `backend/src/modules/users/user.controller.ts`  
**Method:** `findAll()`  
**Signature:**
```typescript
async findAll(
  @Query() paginationDto: PaginationDto,
  @Query('role_id') role_id?: string,        // ← Additional parameter
  @Query('status') status?: 'ACTIVE' | 'INACTIVE',  // ← Additional parameter
)
```

**Query:** `GET /api/users?role_id=<UUID>&limit=1`  
**Parameters:** `role_id` (NOT in `PaginationDto`), `limit` (in `PaginationDto`)  
**Result:** ❌ ValidationPipe rejects `role_id`

---

## 7. REQUEST TESTS

### Test A: Standard pagination (WORKS)
```
GET /api/users?page=1&limit=10
```
**Parameters:** `page`, `limit` (both in `PaginationDto`)  
**Expected:** ✅ HTTP 200 OK  
**Reason:** All parameters are whitelisted

### Test B: With role_id (FAILS)
```
GET /api/users?role_id=85879a77-1ddb-42de-a586-bd3a5dcc08b2&limit=1
```
**Parameters:** `role_id` (NOT in DTO), `limit` (in DTO)  
**Expected:** ❌ HTTP 400 Bad Request  
**Reason:** `role_id` is non-whitelisted

### Test C: Only limit (WORKS)
```
GET /api/users?limit=1
```
**Parameters:** `limit` (in `PaginationDto`)  
**Expected:** ✅ HTTP 200 OK  
**Reason:** All parameters are whitelisted

### Test D: Only role_id (FAILS)
```
GET /api/users?role_id=85879a77-1ddb-42de-a586-bd3a5dcc08b2
```
**Parameters:** `role_id` (NOT in DTO)  
**Expected:** ❌ HTTP 400 Bad Request  
**Reason:** `role_id` is non-whitelisted

### Test E: With status (FAILS)
```
GET /api/users?status=ACTIVE&limit=10
```
**Parameters:** `status` (NOT in DTO), `limit` (in DTO)  
**Expected:** ❌ HTTP 400 Bad Request  
**Reason:** `status` is non-whitelisted

---

## 8. SERVICE LAYER (NOT THE PROBLEM)

**File:** `backend/src/modules/users/user.service.ts`  
**Method:** `findAll()` (line 95-158)

The service layer is **NOT executed** because ValidationPipe rejects request before reaching the service.

If the request passed validation, the service would handle `role_id` correctly:

```typescript
if (role_id) {
  conditions.push({ role_id });  // ← Would work fine
}
```

---

## 9. PRISMA LAYER (NOT THE PROBLEM)

Prisma query would work correctly if it received `role_id`:

```typescript
this.prisma.user.findMany({
  where: {
    AND: [
      { role_id: '...' }  // ← Valid Prisma where clause
    ]
  }
})
```

The problem is **validation layer**, not database layer.

---

## 10. EXACT FAILING LAYER

| Layer | File | Function | Status |
|-------|------|----------|--------|
| Frontend | role.service.ts | getUsersCountByRole() | ✅ Correct |
| API Client | apiClient | GET /users | ✅ Correct |
| NestJS Routing | UserController | - | ✅ Correct |
| **ValidationPipe** | **main.ts** | **validate()** | ❌ **FAILS HERE** |
| Controller Method | UserController | findAll() | ⏸️ Never reached |
| Service | UserService | findAll() | ⏸️ Never reached |
| Prisma | - | - | ⏸️ Never reached |

**Exact Failing File:** `backend/src/main.ts` (ValidationPipe configuration)  
**Exact Failing Line:** Line 28 — `forbidNonWhitelisted: true`  
**Exact Exception:** `BadRequestException` thrown by ValidationPipe  
**Exact Reason:** `role_id` parameter not defined in `PaginationDto`

---

## 11. WHY RESPONSE ONLY SAYS "BAD REQUEST EXCEPTION"

**Problem:** HttpExceptionFilter only extracts `.message`

**ValidationPipe throws:**
```json
{
  "message": "Bad Request Exception",
  "error": [
    {
      "property": "role_id",
      "constraints": {
        "whitelistValidation": "property role_id should not exist"
      }
    }
  ]
}
```

**HttpExceptionFilter extracts:**
```typescript
const message = exception.message;  // ← Only "Bad Request Exception"
```

**Client receives:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Bad Request Exception",
  "data": null
}
```

**Detailed validation errors are LOST.**

---

## 12. MINIMAL FIX REQUIRED

### Option 1: Extend PaginationDto (RECOMMENDED)

Create a `UserQueryDto` that extends `PaginationDto`:

**New File:** `backend/src/modules/users/dto/user-query.dto.ts`
```typescript
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { UserStatus } from '@prisma/client';

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by role ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  role_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by user status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
```

**Modified:** `backend/src/modules/users/user.controller.ts`
```typescript
import { UserQueryDto } from './dto/user-query.dto.js';

async findAll(
  @Query() queryDto: UserQueryDto,  // ← Use UserQueryDto instead
): Promise<PaginatedResponseDto<ResponseUserDto>> {
  const { page, limit, search, role_id, status } = queryDto;
  return this.userService.findAll(page, limit, search, role_id, status);
}
```

**Changes:** 2 files

### Option 2: Disable forbidNonWhitelisted (NOT RECOMMENDED)

**Modified:** `backend/src/main.ts`
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,  // ← Allow unknown properties
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

**Problem:** This disables validation globally, allowing ANY unknown parameters everywhere.

**Changes:** 1 file (but affects entire application)

### Option 3: Improve Exception Filter (SUPPLEMENTARY)

**Modified:** `backend/src/common/filters/http-exception.filter.ts`
```typescript
const message =
  exception instanceof HttpException
    ? this.getDetailedMessage(exception)
    : 'Internal server error';

private getDetailedMessage(exception: HttpException): string {
  const response = exception.getResponse();
  
  if (typeof response === 'object' && 'message' in response) {
    const msg = response.message;
    if (Array.isArray(msg)) {
      return msg.join(', ');  // Join validation errors
    }
    return msg;
  }
  
  return exception.message;
}
```

**Result:** Better error messages for debugging, but doesn't fix root cause.

---

## 13. FILES THAT WOULD NEED MODIFICATION

### Option 1 (Recommended):

**CREATE (1 file):**
- `backend/src/modules/users/dto/user-query.dto.ts`

**MODIFY (1 file):**
- `backend/src/modules/users/user.controller.ts`

**Total:** 2 files

### Option 3 (Supplementary - Better Error Messages):

**MODIFY (1 file):**
- `backend/src/common/filters/http-exception.filter.ts`

---

## 14. FILES THAT MUST NOT BE MODIFIED

✅ `frontend/src/services/role.service.ts` — Request is correct  
✅ `frontend/src/services/user.service.ts` — Not involved in this request  
✅ `frontend/src/views/admin/RolesPage.vue` — Calls service correctly  
✅ `backend/src/modules/users/user.service.ts` — Service logic is correct  
✅ `backend/src/common/dto/pagination.dto.ts` — Shared by other modules  
✅ `backend/prisma/schema.prisma` — Database schema is fine  
✅ All authentication files — Not related to this issue  

---

## 15. EXACT VERIFICATION STEPS

### After Implementing Fix (Option 1):

1. **Create** `backend/src/modules/users/dto/user-query.dto.ts`
2. **Modify** `backend/src/modules/users/user.controller.ts` to use `UserQueryDto`
3. **Restart backend server**
4. **Test Request A:**
   ```
   GET http://localhost:3000/api/users?role_id=<VALID_UUID>&limit=1
   ```
   **Expected:** HTTP 200 OK with user count in meta

5. **Test Request B:**
   ```
   GET http://localhost:3000/api/users?status=ACTIVE&limit=10
   ```
   **Expected:** HTTP 200 OK with active users

6. **Test Request C:**
   ```
   GET http://localhost:3000/api/users?page=1&limit=10&search=admin&role_id=<UUID>&status=ACTIVE
   ```
   **Expected:** HTTP 200 OK with filtered results

7. **Verify Frontend:**
   - Navigate to Admin → Roles
   - **Expected:** User counts appear on role cards without errors
   - **Expected:** No HTTP 400 errors in Network tab

8. **Verify Backend Logs:**
   - No ValidationPipe errors
   - Successful query execution logged

---

## 16. ROOT CAUSE STATEMENT

**The HTTP 400 error occurs because:**

1. Frontend sends: `GET /api/users?role_id=<UUID>&limit=1`
2. `UserController.findAll()` uses `@Query() paginationDto: PaginationDto`
3. `PaginationDto` only defines: `page`, `limit`, `search`
4. Query parameter `role_id` is NOT in `PaginationDto`
5. Global ValidationPipe has `forbidNonWhitelisted: true`
6. ValidationPipe rejects `role_id` as non-whitelisted property
7. ValidationPipe throws `BadRequestException`
8. HttpExceptionFilter only extracts generic `.message`
9. Client receives: "Bad Request Exception" without details

**Solution:** Create `UserQueryDto` extending `PaginationDto` with `role_id` and `status` fields.

---

## 17. ADDITIONAL FINDINGS

### Why This Wasn't Caught Earlier

1. **Role listing works** — No additional query parameters needed
2. **User listing works** — Uses standard pagination without filters
3. **User counts by role FAILS** — Adds `role_id` filter parameter
4. **Bug is triggered** — Only when filtering users by role

### Why Error Message is Unhelpful

**HttpExceptionFilter** extracts only `.message` from exceptions.  
**ValidationPipe errors** have detailed structure in `.error` array.  
**Improvement needed** in exception filter to expose validation details.

### Similar Issues in Other Endpoints

**Check other endpoints** that might have the same pattern:
```typescript
@Query() paginationDto: PaginationDto,
@Query('some_filter') some_filter?: string
```

These will ALL fail with `forbidNonWhitelisted: true`.

---

## 18. DIAGNOSTIC EVIDENCE SUMMARY

| Evidence | Location | Finding |
|----------|----------|---------|
| Frontend Request | role.service.ts:168 | ✅ Sends `role_id` correctly |
| API Call | Network Tab | ✅ `GET /users?role_id=...&limit=1` |
| Controller | user.controller.ts:110 | ✅ Accepts `role_id` via `@Query('role_id')` |
| DTO | pagination.dto.ts | ❌ Does NOT define `role_id` |
| ValidationPipe | main.ts:28 | ❌ Rejects non-whitelisted properties |
| Exception | ValidationPipe | ❌ Throws BadRequestException |
| Filter | http-exception.filter.ts:20 | ❌ Only extracts `.message` |
| Response | Client | ❌ Generic "Bad Request Exception" |

---

## 19. CONCLUSION

**Problem Layer:** Backend ValidationPipe configuration  
**Problem File:** `backend/src/main.ts` + missing `UserQueryDto`  
**Problem Line:** Line 28 (`forbidNonWhitelisted: true`) + Controller using partial DTO  
**Solution:** Create `UserQueryDto` extending `PaginationDto` with filter fields  
**Impact:** Minimal (2 files: create 1, modify 1)  
**Risk:** Low (isolated to user endpoint)  

**This is a classic DTO validation architecture mismatch, NOT a frontend bug.**

---

**Report Generated:** August 14, 2026  
**Investigation Duration:** ~45 minutes  
**Diagnostic Approach:** Evidence-based request trace  
**Code Modifications Made:** NONE (diagnostic only as instructed)  
**Ready for Implementation:** YES
