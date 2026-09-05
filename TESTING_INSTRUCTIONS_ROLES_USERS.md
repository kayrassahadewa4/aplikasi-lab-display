# TESTING INSTRUCTIONS — ROLES & USERS MODULE INTEGRATION

**Date**: August 13, 2026  
**Phase**: 11 Part 3A - Administrator Portal API Integration  
**Modules**: Roles & Users  
**Status**: Ready for Testing ✅

---

## ENVIRONMENT SETUP

### Servers Status
- ✅ **Backend**: Running on http://localhost:3000 (Terminal 5)
- ✅ **Frontend**: Running on http://localhost:5173 (Terminal 6)
- ✅ **Database**: PostgreSQL with seeded data

### Test Credentials
```
Administrator:
  Email: admin@lab.com
  Password: password123

Laboran:
  Email: laboran@lab.com
  Password: password123

Lecturer (Dosen):
  Email: lecturer@lab.com
  Password: password123
```

---

## TESTING WORKFLOW

### STEP 1: LOGIN AS ADMINISTRATOR

1. Open browser and navigate to: **http://localhost:5173/login**
2. Enter credentials:
   - Email: `admin@lab.com`
   - Password: `password123`
3. Click "Sign In"
4. ✅ **Expected**: Redirect to `/admin` dashboard

---

### STEP 2: TEST ROLES MODULE

#### 2.1 View Roles List
1. Click "Roles" in the sidebar navigation
2. ✅ **Expected**: 
   - URL changes to `/admin/roles`
   - Page displays roles from database
   - Should show: ADMIN, LABORAN, DOSEN roles
   - Summary cards show correct counts
   - Each role card shows:
     - Role name and code
     - Description
     - Permission level badge
     - User count
     - Permissions list snippet

#### 2.2 Search Roles
1. Type "admin" in the search box
2. ✅ **Expected**: List filters to show only Administrator role
3. Clear search
4. ✅ **Expected**: All roles display again

#### 2.3 Filter Roles
1. Use "All Access Levels" dropdown
2. Select "Full Access"
3. ✅ **Expected**: Only ADMIN role displays
4. Select "Request Access"
5. ✅ **Expected**: Only DOSEN role displays
6. Select "All Access Levels"
7. ✅ **Expected**: All roles display

#### 2.4 View Role Details
1. Click on "Administrator" role card
2. ✅ **Expected**: Navigate to `/admin/roles/{role-id}` detail page
3. Use browser back button to return to roles list

#### 2.5 Delete Role (Protection Check)
1. Try to delete ADMIN, LABORAN, or DOSEN role
2. ✅ **Expected**: Delete button should NOT appear for system roles (`isSystem: true`)
3. If you created a custom role earlier, test deletion on that

#### 2.6 Data Persistence
1. Refresh the page (F5)
2. ✅ **Expected**: 
   - All roles still display
   - Data loaded from backend database (not localStorage)
   - User counts accurate

---

### STEP 3: TEST USERS MODULE

#### 3.1 View Users List
1. Click "Users" in the sidebar navigation
2. ✅ **Expected**:
   - URL changes to `/admin/users`
   - Page displays users from database
   - Should show at least 3 users: admin, laboran, lecturer
   - Summary cards show correct counts
   - Table displays:
     - User name with avatar
     - Email
     - Role badge
     - Phone
     - Status badge
     - Registered date
     - Action buttons

#### 3.2 Search Users
1. Type "admin" in search box
2. ✅ **Expected**: List filters to show only admin user
3. Type "lab.com" in search box
4. ✅ **Expected**: All users with @lab.com email display
5. Clear search
6. ✅ **Expected**: All users display

#### 3.3 Filter by Role
1. Use "All Roles" dropdown
2. Select "Administrator"
3. ✅ **Expected**: Only admin users display
4. Select "Laboran"
5. ✅ **Expected**: Only laboran users display
6. Select "Dosen / Pemohon"
7. ✅ **Expected**: Only lecturer users display
8. Select "All Roles"
9. ✅ **Expected**: All users display

#### 3.4 Filter by Status
1. Use "All Statuses" dropdown
2. Select "Active"
3. ✅ **Expected**: Only active users display
4. Select "Inactive"
5. ✅ **Expected**: Only inactive users display (may be empty)
6. Select "All Statuses"
7. ✅ **Expected**: All users display

#### 3.5 Pagination
1. Note current page shows users
2. Click "Next Page" button (right arrow)
3. ✅ **Expected**: 
   - Page number increments
   - New set of users loads
   - Backend API called with new page number
4. Click "Previous Page" button (left arrow)
5. ✅ **Expected**: Return to previous page

#### 3.6 View User Details
1. Click on any user row
2. ✅ **Expected**: Navigate to `/admin/users/{user-id}` detail page
3. Use browser back button to return to users list

#### 3.7 Delete User
**⚠️ WARNING: This will permanently delete data from database!**

1. Find a test user (not admin@lab.com)
2. Click delete icon (trash icon)
3. ✅ **Expected**: Delete confirmation modal appears
4. Click "Delete User"
5. ✅ **Expected**:
   - Modal closes
   - User list reloads
   - Deleted user no longer appears
   - Summary card counts update

#### 3.8 Data Persistence After Delete
1. Refresh the page (F5)
2. ✅ **Expected**:
   - Deleted user still absent (permanent delete from database)
   - All other users remain
   - Data loaded from backend

---

### STEP 4: AUTHORIZATION TESTING

#### 4.1 Test Laboran Access
1. Logout from admin account
2. Login as: `laboran@lab.com` / `password123`
3. Try to access `/admin/roles`
4. ✅ **Expected**: 
   - Either shows read-only view OR
   - Redirects with 403 Forbidden error
5. Try to access `/admin/users`
6. ✅ **Expected**: Same behavior (read-only or forbidden)

#### 4.2 Test Dosen Access
1. Logout from laboran account
2. Login as: `lecturer@lab.com` / `password123`
3. Try to access `/admin/roles`
4. ✅ **Expected**: 
   - Either shows read-only view OR
   - Redirects with 403 Forbidden error
5. Try to access `/admin/users`
6. ✅ **Expected**: Same behavior

---

### STEP 5: ERROR HANDLING TESTS

#### 5.1 Test 401 Unauthorized
1. Open browser DevTools (F12)
2. Go to Application → Storage → Clear site data
3. Try to access `/admin/roles` without token
4. ✅ **Expected**: Redirect to `/login` page

#### 5.2 Test Backend Connection
1. **DO NOT stop the backend server** (we need it running)
2. In DevTools Network tab, observe API calls
3. Navigate to `/admin/roles`
4. ✅ **Expected**: See `GET /api/roles` request with 200 status
5. Click on request to see response structure

#### 5.3 Test JWT Token Injection
1. In DevTools Network tab
2. Click on any `/api/roles` or `/api/users` request
3. Go to "Headers" tab
4. ✅ **Expected**: See `Authorization: Bearer <token>` header

---

## VERIFICATION CHECKLIST

### Roles Module
- [ ] Roles load from backend database
- [ ] Search filtering works
- [ ] Permission level filtering works
- [ ] View role details navigates correctly
- [ ] System roles protected from deletion
- [ ] Data persists after page refresh
- [ ] User counts accurate
- [ ] Summary cards show correct totals
- [ ] No console errors

### Users Module
- [ ] Users load from backend database
- [ ] Search filtering works
- [ ] Role filtering works
- [ ] Status filtering works
- [ ] Pagination works (page navigation)
- [ ] View user details navigates correctly
- [ ] Delete user removes from database
- [ ] User list reloads after delete
- [ ] Data persists after page refresh
- [ ] Summary cards show correct totals
- [ ] No console errors

### API Integration
- [ ] JWT token injected in all requests
- [ ] 401 errors redirect to login
- [ ] 403 errors handled gracefully
- [ ] Loading states display during API calls
- [ ] Error messages display for failures
- [ ] Network tab shows proper API calls

### Authorization
- [ ] Admin has full CRUD access
- [ ] Laboran has restricted access
- [ ] Dosen has restricted access
- [ ] Unauthorized users redirected

---

## DEBUGGING TIPS

### If Roles/Users Don't Load:
1. Check browser console (F12) for errors
2. Check Network tab for failed API requests
3. Verify backend server is running on port 3000
4. Verify JWT token exists (Application → Local Storage)
5. Try logout and login again to refresh token

### If Delete Doesn't Work:
1. Check console for error messages
2. Verify you're logged in as admin
3. Check that system roles (ADMIN, LABORAN, DOSEN) cannot be deleted
4. Check Network tab for DELETE request response

### If Pagination Doesn't Work:
1. Check if backend has enough data (>10 users)
2. Check Network tab for page parameter in requests
3. Verify `meta` object in API response

### If Search/Filter Doesn't Work:
1. Check Network tab to see if parameters sent to backend
2. For role filter, it's client-side filtering (check frontend logic)
3. For search, it's backend filtering (check API request params)

---

## EXPECTED API REQUESTS

### Roles Page Load:
```
GET /api/roles?page=1&limit=100
Response: { data: { data: [...roles], meta: {...} } }
```

### Users Page Load:
```
GET /api/users?page=1&limit=10
Response: { data: { data: [...users], meta: {...} } }
```

### User Count for Role:
```
GET /api/users?role_id={roleId}&limit=1
Response: { data: { data: [...], meta: { total: X } } }
```

### Delete User:
```
DELETE /api/users/{userId}
Response: 204 No Content
```

---

## KNOWN LIMITATIONS

1. **lastActive field**: Backend doesn't track user activity, shows "N/A"
2. **Role status**: Backend doesn't have role status, defaults to "Active"
3. **Custom role deletion**: Only non-system roles can be deleted
4. **User pagination**: Limited to 10 users per page
5. **Role pagination**: Fetches all roles (limit=100)

---

## NEXT STEPS AFTER TESTING

Once Roles and Users modules are verified working:
1. ✅ Mark STEP C (Roles & Users) as complete
2. 🔜 Proceed to Laboratories module integration
3. 🔜 Continue with Facilities, Academic Calendars, etc.
4. 🔜 Complete all 7 master data modules
5. 🔜 Move to STEP D: Transactions Integration

---

## SUPPORT

**If you encounter issues**:
1. Check this document's debugging section
2. Review console errors
3. Check Network tab for API failures
4. Verify backend is running and seeded
5. Try logging out and back in
6. Check JWT token is valid

**Backend API Documentation**: See `PHASE_11_PART_3A_API_AUDIT_REPORT.md`

---

**Document Version**: 1.0  
**Last Updated**: August 13, 2026  
**Testing Scope**: Roles & Users Modules Only  
**Status**: Ready for Manual Testing ✅
