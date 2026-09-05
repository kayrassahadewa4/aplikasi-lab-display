# HTTP 400 DIAGNOSTIC — QUICK SUMMARY

## ✅ ROOT CAUSE IDENTIFIED

**Problem:** NestJS ValidationPipe rejects `role_id` query parameter as "non-whitelisted"

## THE ISSUE

```
GET /api/users?role_id=<UUID>&limit=1
→ HTTP 400 Bad Request
```

### Why It Fails

1. **Controller uses:**
   ```typescript
   findAll(@Query() paginationDto: PaginationDto, @Query('role_id') role_id?: string)
   ```

2. **PaginationDto only defines:**
   - ✅ `page`
   - ✅ `limit`
   - ✅ `search`
   - ❌ NOT `role_id`

3. **ValidationPipe config:**
   ```typescript
   forbidNonWhitelisted: true  // ← Rejects unknown properties
   ```

4. **Result:** 
   - ValidationPipe sees `role_id` in query string
   - `role_id` is NOT in `PaginationDto`
   - **ValidationPipe rejects entire request**

## THE FIX (2 files)

### 1. Create New DTO

**File:** `backend/src/modules/users/dto/user-query.dto.ts`

```typescript
import { IsOptional, IsUUID, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';
import { UserStatus } from '@prisma/client';

export class UserQueryDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  role_id?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
```

### 2. Update Controller

**File:** `backend/src/modules/users/user.controller.ts`

```typescript
import { UserQueryDto } from './dto/user-query.dto.js';

async findAll(
  @Query() queryDto: UserQueryDto,  // ← Changed from PaginationDto
): Promise<PaginatedResponseDto<ResponseUserDto>> {
  const { page, limit, search, role_id, status } = queryDto;
  return this.userService.findAll(page, limit, search, role_id, status);
}
```

## WHAT HAPPENS AFTER FIX

✅ ValidationPipe recognizes `role_id` as valid property  
✅ Request passes validation  
✅ Controller receives `role_id`  
✅ Service filters users by role  
✅ Frontend gets user counts correctly  

## WHY ERROR MESSAGE WAS UNHELPFUL

**ValidationPipe throws:**
```json
{
  "message": "Bad Request Exception",
  "error": ["property role_id should not exist"]
}
```

**Exception filter only extracts `.message`** → Detailed errors lost

---

**See `PHASE_11_PART_3D_HTTP400_DIAGNOSTIC_REPORT.md` for complete analysis**
