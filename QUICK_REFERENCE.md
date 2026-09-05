# QUICK REFERENCE — PHASE 11 PART 3A

## 🚀 SERVERS

```bash
Backend:  http://localhost:3000 (Terminal 5)
Frontend: http://localhost:5173 (Terminal 6)
Status:   ✅ Both Running
```

## 🔑 TEST CREDENTIALS

```
Admin:      admin@lab.com     / password123
Laboran:    laboran@lab.com   / password123
Lecturer:   lecturer@lab.com  / password123
```

## 📊 PROGRESS TRACKER

### ✅ COMPLETED (2/7 Master Data Modules)
- [x] Roles Module
- [x] Users Module

### 🔜 PENDING (5/7 Master Data Modules)
- [ ] Laboratories
- [ ] Facilities  
- [ ] Academic Calendars
- [ ] Operational Hours
- [ ] Announcements

### 📍 CURRENT PHASE
**Phase 11 Part 3A**: Administrator Portal API Integration  
**Current Step**: STEP C - Master Data Integration  
**Status**: 2 of 7 modules complete (~28%)

## 🧪 TESTING

### Test Roles Module:
1. Login as admin@lab.com
2. Navigate to `/admin/roles`
3. Test search, filter, view, delete
4. Refresh page → verify persistence

### Test Users Module:
1. Navigate to `/admin/users`
2. Test search, role filter, status filter
3. Test pagination
4. Test delete → verify reload
5. Refresh page → verify persistence

**Full Instructions**: `TESTING_INSTRUCTIONS_ROLES_USERS.md`

## 📁 KEY FILES

### Services Created/Modified:
```
frontend/src/services/role.service.ts    ✅ Integrated
frontend/src/services/user.service.ts    ✅ Created
frontend/src/services/index.ts           ✅ Updated
```

### Components Modified:
```
frontend/src/views/admin/RolesPage.vue   ✅ Integrated
frontend/src/views/admin/UsersPage.vue   ✅ Integrated
```

### Documentation:
```
PHASE_11_PART_3A_API_AUDIT_REPORT.md              60+ endpoints documented
PHASE_11_PART_3A_STEP_C_INTEGRATION_PROGRESS.md  Progress tracking
TESTING_INSTRUCTIONS_ROLES_USERS.md              Testing guide
SESSION_SUMMARY_PHASE_11_PART_3A.md              Complete summary
```

## 🔧 DEBUG COMMANDS

### Check Server Status:
```bash
# Frontend
cd frontend
npm run dev

# Backend  
cd backend
npm run start:dev
```

### View Logs:
```bash
# Check browser console (F12)
# Check Network tab for API calls
# Verify JWT token in Request Headers
```

### Common Issues:
```
❌ Roles don't load        → Check JWT token, backend running
❌ Delete doesn't work     → Check if system role (protected)
❌ 401 error              → Token expired, logout/login
❌ Search not working     → Check Network tab for API params
```

## 📋 NEXT STEPS

1. ✅ Test Roles & Users modules (30 min)
2. 🔜 Integrate Laboratories module (1 hour)
3. 🔜 Integrate Facilities module (1 hour)
4. 🔜 Continue with remaining master data modules

## 🎯 SUCCESS CRITERIA

- [ ] All CRUD operations working
- [ ] Data persists after refresh
- [ ] Search/filter working
- [ ] Pagination working
- [ ] Authorization enforced
- [ ] No console errors
- [ ] UI design preserved

## 📞 QUICK CONTACTS

**Backend API**: http://localhost:3000/api  
**Swagger Docs**: (if enabled) http://localhost:3000/api/docs  
**Frontend App**: http://localhost:5173

**Database**: PostgreSQL (seeded with test data)

---

**Last Updated**: August 13, 2026  
**Version**: 1.0  
**Status**: Roles & Users Complete ✅
