# MANUAL TESTING CHECKLIST — ROLES & USERS FIX VERIFICATION

**Date**: August 13, 2026  
**Fix**: HTTP 400 Error Resolution  
**Modules**: Roles & Users  

---

## PREREQUISITES

✅ Backend running on: http://localhost:3000  
✅ Frontend running on: http://localhost:5173  
✅ Test credentials: admin@lab.com / password123

---

## TEST 1: LOGIN

1. Open browser: http://localhost:5173/login
2. Enter: admin@lab.com / password123
3. Click "Sign In"

**Expected**: ✅ Redirect to `/admin` dashboard

---

## TEST 2: ROLES PAGE - NO HTTP 400 ERRORS

1. Navigate to `/admin/roles`
2. **Open Browser DevTools** (F12)
3. Go to **Console** tab
4. Go to **Network** tab

### Console Check:
**Expected**: 
- ✅ NO red error messages
- ✅ NO "Failed to count users for role" errors
- ✅ NO "AxiosError: Request failed with status code 400"

### Network Check:
Look for requests like:
```
GET /api/users?role_id=<UUID>&limit=1
```

**Expected**: 
- ✅ Status: 200 OK (NOT 400!)
- ✅ Multiple requests (one per role)
- ✅ All return 200 OK

### Visual Check:
**Expected**:
- ✅ Roles display in grid
- ✅ Each role card shows a number for "X Users"
- ✅ Summary cards show correct totals
- ✅ No loading spinners stuck

---

## TEST 3: USER COUNTS ACCURACY

Check each role card:

**Administrator**:
- Expected count: 1-3 users (check actual database)
- Verify number displayed matches database

**Laboran**:
- Expected count: 1-2 users
- Verify number displayed matches database

**Dosen / Pemohon**:
- Expected count: 1+ users
- Verify number displayed matches database

**To verify actual count**, check Network tab:
1. Find: `GET /api/users?role_id=<UUID>&limit=1`
2. Click on request
3. Go to "Response" tab
4. Look for:
   ```json
   {
     "data": {
       "meta": {
         "total": 3  ← This is the count
       }
     }
   }
   ```

---

## TEST 4: ROLES PAGE - SEARCH/FILTER

### Search:
1. Type "admin" in search box
2. **Expected**: Only Administrator role shows

### Filter:
1. Use "All Access Levels" dropdown
2. Select "Full Access"
3. **Expected**: Only Administrator role shows
4. Select "Request Access"
5. **Expected**: Only Dosen / Pemohon role shows

---

## TEST 5: USERS PAGE - NO HTTP 400 ERRORS

1. Navigate to `/admin/users`
2. Check **Console** tab
3. Check **Network** tab

### Console Check:
**Expected**:
- ✅ NO errors
- ✅ Users load successfully

### Network Check:
Look for:
```
GET /api/users?page=1&limit=10
```

**Expected**:
- ✅ Status: 200 OK
- ✅ Response contains users array
- ✅ Response contains meta object with pagination

---

## TEST 6: USERS PAGE - FILTERING

### Search:
1. Type "admin" in search box
2. Wait for request: `GET /api/users?page=1&limit=10&search=admin`
3. **Expected**: 
   - ✅ Status: 200 OK
   - ✅ Only users matching "admin" show

### Filter by Role:
1. Use "All Roles" dropdown
2. Select "Administrator"
3. **Expected**: Only admin users show (client-side filter)

### Filter by Status:
1. Use "All Statuses" dropdown
2. Select "Active"
3. Wait for request: `GET /api/users?page=1&limit=10&status=ACTIVE`
4. **Expected**:
   - ✅ Status: 200 OK
   - ✅ Only active users show

---

## TEST 7: PAGINATION

1. On Users page, click "Next Page" (right arrow)
2. Wait for request: `GET /api/users?page=2&limit=10`
3. **Expected**:
   - ✅ Status: 200 OK
   - ✅ New set of users loads
   - ✅ Page number increments

---

## TEST 8: DELETE USER (DATA PERSISTENCE)

1. Find a test user (NOT admin@lab.com)
2. Click delete icon (trash)
3. Confirm deletion
4. Wait for request: `DELETE /api/users/<UUID>`
5. **Expected**:
   - ✅ Status: 204 No Content
   - ✅ User disappears from list
   - ✅ List reloads
6. **Refresh browser** (F5)
7. **Expected**: 
   - ✅ Deleted user still absent (from database)

---

## TEST 9: JWT TOKEN VERIFICATION

1. In Network tab, click any `/api/users` or `/api/roles` request
2. Go to "Headers" tab
3. Scroll to "Request Headers"

**Expected**:
```
Authorization: Bearer <LONG_JWT_TOKEN>
```

✅ Token must be present in ALL API requests

---

## TEST 10: RBAC VERIFICATION (OPTIONAL)

### Test as Laboran:
1. Logout
2. Login as: laboran@lab.com / password123
3. Try to access: `/admin/roles`
4. **Expected**: 403 Forbidden OR redirect

### Test as Dosen:
1. Logout
2. Login as: lecturer@lab.com / password123
3. Try to access: `/admin/users`
4. **Expected**: 403 Forbidden OR redirect

---

## PASS CRITERIA

### ✅ ALL TESTS MUST PASS:

- [ ] Login successful
- [ ] Roles page loads without errors
- [ ] NO HTTP 400 errors in console
- [ ] User counts display correctly
- [ ] Network tab shows 200 OK for all requests
- [ ] Search/filter works on Roles page
- [ ] Users page loads without errors
- [ ] Users search works
- [ ] Users status filter works
- [ ] Pagination works
- [ ] Delete user removes from database
- [ ] JWT token present in all requests
- [ ] UI design unchanged
- [ ] No visual regressions

---

## FAIL SCENARIOS

### ❌ IF YOU SEE:

**HTTP 400 Bad Request**:
- ❌ FAILED - Backend still rejecting parameters
- Check: Are backend changes compiled?
- Check: Is backend server restarted?

**HTTP 401 Unauthorized**:
- ❌ Token expired or missing
- Solution: Logout and login again

**HTTP 403 Forbidden**:
- ❌ Not logged in as admin
- Solution: Login as admin@lab.com

**HTTP 404 Not Found**:
- ❌ Endpoint doesn't exist
- Check: Backend routes registered?

**User counts show "0" for all roles**:
- ❌ FAILED - Query not returning data
- Check: Database has users?
- Check: Backend filtering logic correct?

**Deleted user returns after refresh**:
- ❌ FAILED - localStorage fallback active
- Check: Frontend not using real API

---

## DEBUGGING COMMANDS

### Check Backend Routes:
Look in backend console for:
```
[RouterExplorer] Mapped {/api/users, GET} route
```

### Check Request Parameters:
In Network tab, click request, check "Query String Parameters":
```
role_id: <UUID>
limit: 1
```

### Check Response Structure:
In Network tab, click request, go to "Response" tab:
```json
{
  "data": {
    "data": [...],
    "meta": {
      "total": 3,
      "page": 1,
      "limit": 1
    }
  }
}
```

---

## REPORT RESULT

After completing all tests, document:

✅ **SUCCESS**: All tests passed, HTTP 400 errors resolved  
❌ **FAILED**: Specify which test failed and error message

---

**Checklist Created**: August 13, 2026  
**Status**: Ready for Manual Testing  
**Estimated Time**: 10-15 minutes
