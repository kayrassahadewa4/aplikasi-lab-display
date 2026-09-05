# LABORATORIES INTEGRATION — TESTING CHECKLIST

Use this checklist to verify the Laboratories integration is working correctly.

---

## PRE-TESTING SETUP

✅ **Ensure both servers are running**:
```bash
# Terminal 1 — Backend
cd backend
npm run start:dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

✅ **Login as ADMIN**:
- Email: `admin@lab.com`
- Password: `password123`

---

## TEST 1: LIST VIEW — Load Laboratories

**Steps**:
1. Navigate to **Admin → Laboratories**
2. Observe the page loading

**Expected**:
- ✅ Loading spinner appears briefly
- ✅ Laboratories list populates from API
- ✅ Summary cards show correct counts:
  - Total Laboratories (from API)
  - Active Labs (filtered from API data)
  - Under Maintenance (filtered from API data)
  - Total Equipment Units (may show 0 if backend doesn't provide facilities)
- ✅ DevTools → Network shows: `GET /api/laboratories?page=1&limit=1000` → HTTP 200

**If Fails**:
- Check backend is running on port 3000
- Check JWT token is valid (re-login if expired)
- Check Network tab for error response

---

## TEST 2: SEARCH & FILTER

**Steps**:
1. Type in search box (e.g., "Software")
2. Change status filter (e.g., "Maintenance")

**Expected**:
- ✅ Search triggers new API request
- ✅ Results update immediately
- ✅ Filter works correctly
- ✅ DevTools shows: `GET /api/laboratories?page=1&limit=1000&search=Software`

---

## TEST 3: CREATE — New Laboratory

**Steps**:
1. Click **"Create Laboratory"** button
2. Fill out form:
   - Laboratory Name: "Test Lab Integration"
   - Room Code: "LAB-TEST"
   - Location: "Building X · Floor 1"
   - Maximum Capacity: 25
   - Status: Active
   - Description: (optional) "Integration test laboratory"
3. Click **"Create Laboratory"**

**Expected**:
- ✅ Submit button shows "Saving..." with spinner
- ✅ Success toast appears: "New laboratory created successfully."
- ✅ Redirects to `/admin/laboratories`
- ✅ New laboratory appears in the list
- ✅ DevTools shows: `POST /api/laboratories` → HTTP 201 Created

**If Fails**:
- Check JWT token has ADMIN role
- Check validation errors in Network tab response
- Check backend logs for errors

---

## TEST 4: DETAIL VIEW — Read Laboratory

**Steps**:
1. Click on any laboratory card
2. Observe detail page

**Expected**:
- ✅ Loading spinner appears briefly
- ✅ Laboratory details load from API
- ✅ All fields display correctly (name, code, location, capacity, status)
- ✅ Facilities section shows if available
- ✅ DevTools shows: `GET /api/laboratories/:id` → HTTP 200

---

## TEST 5: EDIT — Update Laboratory

**Steps**:
1. From detail page, click **"Edit Laboratory"**
2. Modify fields (e.g., change capacity from 25 → 30)
3. Click **"Save Changes"**

**Expected**:
- ✅ Form pre-populates with existing data
- ✅ Submit button shows "Saving..." with spinner
- ✅ Success toast appears: "Laboratory updated successfully."
- ✅ Redirects back to detail page
- ✅ Changes are visible on detail page
- ✅ DevTools shows: `PATCH /api/laboratories/:id` → HTTP 200

---

## TEST 6: DELETE — Remove Laboratory

**Steps**:
1. From detail page, click trash icon (delete button)
2. Confirm deletion in modal
3. Click **"Delete Room"**

**Expected**:
- ✅ Confirmation modal appears
- ✅ Delete button shows "Deleting..." with spinner
- ✅ Success toast appears: "Laboratory room deleted successfully."
- ✅ Redirects to `/admin/laboratories`
- ✅ Laboratory no longer in list
- ✅ DevTools shows: `DELETE /api/laboratories/:id` → HTTP 200

---

## TEST 7: PERSISTENCE — Refresh Verification

**Steps**:
1. After creating/editing a laboratory
2. Press **F5** to hard refresh the page

**Expected**:
- ✅ Changes persist (data comes from PostgreSQL)
- ✅ No reversion to mock data
- ✅ List reloads from API

---

## TEST 8: ERROR HANDLING — Backend Disconnected

**Steps**:
1. Stop backend server (Ctrl+C in backend terminal)
2. Try to load laboratories page

**Expected**:
- ✅ Error alert banner appears: "Error Loading Laboratories"
- ✅ "Retry" button available
- ✅ User is not stuck with loading spinner forever

**Then**:
3. Restart backend server
4. Click "Retry" button

**Expected**:
- ✅ Page successfully reloads from API

---

## TEST 9: VALIDATION — Invalid Input

**Steps**:
1. Click "Create Laboratory"
2. Try to submit with empty fields
3. Try to create laboratory with duplicate code

**Expected**:
- ✅ Browser validation prevents submission (required fields)
- ✅ Backend returns validation error for duplicate code
- ✅ Error message displayed to user

---

## TEST 10: STATUS MAPPING — Verify Enum Conversion

**Steps**:
1. Create laboratory with status "Active"
2. Check DevTools → Network → Request Payload

**Expected**:
- ✅ Frontend sends: `"status": "AVAILABLE"` (backend enum)
- ✅ Backend stores: `AVAILABLE` in database
- ✅ Frontend receives: `"status": "AVAILABLE"`
- ✅ Frontend displays: "Active" badge

---

## SUMMARY CHECKLIST

- [ ] TEST 1: List view loads from API
- [ ] TEST 2: Search and filter work
- [ ] TEST 3: Create new laboratory
- [ ] TEST 4: Detail view loads
- [ ] TEST 5: Edit updates correctly
- [ ] TEST 6: Delete removes laboratory
- [ ] TEST 7: Data persists after refresh
- [ ] TEST 8: Error handling works
- [ ] TEST 9: Validation prevents invalid input
- [ ] TEST 10: Status enum mapping correct

---

## IF ALL TESTS PASS

✅ **Phase 11 Part 3D — Laboratories Integration is WORKING CORRECTLY**

You can proceed to the next phase of the project.

---

## IF TESTS FAIL

**Debugging Steps**:
1. Open DevTools → Console (check for JavaScript errors)
2. Open DevTools → Network (check for HTTP errors)
3. Check backend terminal for errors
4. Verify JWT token is valid (re-login if needed)
5. Verify user has ADMIN role
6. Check backend database has laboratories table seeded
7. Review implementation report: `PHASE_11_PART_3D_LABORATORIES_INTEGRATION_REPORT.md`

**Common Issues**:
- **401 Unauthorized**: JWT token expired → re-login
- **403 Forbidden**: User doesn't have ADMIN role
- **404 Not Found**: Backend route not registered
- **500 Internal Server Error**: Check backend logs
- **Network Error**: Backend not running on port 3000

---

**Good luck with testing!** 🚀
