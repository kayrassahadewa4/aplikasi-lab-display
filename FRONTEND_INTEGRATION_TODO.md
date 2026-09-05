# Frontend Integration TODO
## Phase 11 Part 2 - Authentication & RBAC

**Status:** Backend Complete ✅ | Frontend Pending 🔲

---

## Overview

The backend JWT authentication system is fully implemented and tested. The frontend still uses mock authentication and needs to be updated to integrate with the real backend API.

---

## Required Changes

### 1. Update Auth Service
**File:** `frontend/src/services/auth.service.ts`

**Current:** Mock authentication (returns fake tokens)  
**Required:** Real API integration

```typescript
// Replace mock implementation with:
async login(email: string, password: string) {
  const response = await api.post('/auth/login', { email, password });
  const { accessToken, user } = response.data.data;
  
  // Store token
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('user', JSON.stringify(user));
  
  return { token: accessToken, user };
}

async getCurrentUser() {
  const response = await api.get('/auth/me');
  return response.data.data;
}

async logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}
```

---

### 2. Update Axios Interceptor
**File:** `frontend/src/services/api.ts`

**Required:** Inject JWT token in every request

```typescript
// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

---

### 3. Update Auth Store
**File:** `frontend/src/stores/auth.store.ts`

**Current:** Uses mock state  
**Required:** Real authentication state management

```typescript
// Initialize from localStorage
const token = localStorage.getItem('access_token');
const storedUser = localStorage.getItem('user');

state: {
  isAuthenticated: !!token,
  user: storedUser ? JSON.parse(storedUser) : null,
  token: token,
}

// Update login action
async login(email: string, password: string) {
  const { token, user } = await authService.login(email, password);
  this.isAuthenticated = true;
  this.user = user;
  this.token = token;
}

// Update logout action
logout() {
  authService.logout();
  this.isAuthenticated = false;
  this.user = null;
  this.token = null;
}

// Add session restoration
async restoreSession() {
  const token = localStorage.getItem('access_token');
  if (token) {
    try {
      const user = await authService.getCurrentUser();
      this.isAuthenticated = true;
      this.user = user;
      this.token = token;
    } catch (error) {
      // Token invalid
      this.logout();
    }
  }
}
```

---

### 4. Update User Types
**File:** `frontend/src/types/user.types.ts`

**Current:**
```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  LABORAN = 'LABORAN',
  LECTURER = 'LECTURER',  // ❌ WRONG
}
```

**Required:**
```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  LABORAN = 'LABORAN',
  DOSEN = 'DOSEN',  // ✅ CORRECT
}
```

**Note:** Backend uses 'DOSEN', not 'LECTURER'

---

### 5. Update Route Guards
**File:** `frontend/src/router/guards.ts`

**Required:** Check real authentication state

```typescript
export function authGuard(to, from, next) {
  const authStore = useAuthStore();
  
  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login');
    return;
  }
  
  // Check role-based access
  if (to.meta.roles && !to.meta.roles.includes(authStore.user?.role?.code)) {
    next('/unauthorized');
    return;
  }
  
  next();
}
```

---

### 6. Update App Initialization
**File:** `frontend/src/main.ts` or `App.vue`

**Required:** Restore session on app load

```typescript
// In main.ts or App.vue mounted()
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();

// Restore session from localStorage
authStore.restoreSession();
```

---

### 7. Update Login Page
**File:** `frontend/src/views/Login.vue`

**Required:** Handle real API errors

```typescript
async function handleLogin() {
  try {
    isLoading.value = true;
    error.value = '';
    
    await authStore.login(email.value, password.value);
    
    // Redirect based on role
    const role = authStore.user?.role?.code;
    if (role === 'ADMIN') {
      router.push('/admin/dashboard');
    } else if (role === 'LABORAN') {
      router.push('/laboran/check-in');
    } else if (role === 'DOSEN') {
      router.push('/dosen/requests');
    }
  } catch (err) {
    // Handle specific errors
    if (err.response?.status === 401) {
      error.value = 'Invalid email or password';
    } else {
      error.value = 'Login failed. Please try again.';
    }
  } finally {
    isLoading.value = false;
  }
}
```

---

## Testing Checklist

### Authentication Tests
- [ ] Login with valid credentials (all 3 roles)
- [ ] Login with wrong password → shows error
- [ ] Login with unknown email → shows error
- [ ] Session restoration after page refresh
- [ ] Logout clears auth state
- [ ] Logout redirects to login page

### Authorization Tests
- [ ] ADMIN can access admin pages
- [ ] LABORAN can access laboran pages
- [ ] DOSEN can access dosen pages
- [ ] Unauthorized access redirects to 403/login
- [ ] Token expiration redirects to login

### API Integration Tests
- [ ] All protected API calls include Bearer token
- [ ] 401 responses trigger logout
- [ ] 403 responses show unauthorized message
- [ ] API errors are handled gracefully

### UI/UX Tests
- [ ] Login form shows loading state
- [ ] Login errors display clearly
- [ ] Navigation menu updates based on role
- [ ] Protected routes are inaccessible when logged out
- [ ] Session persists across page refreshes

---

## Test User Credentials

Use these credentials for testing:

| Email               | Password    | Role    | Access Level        |
|---------------------|-------------|---------|---------------------|
| admin@lab.com       | password123 | ADMIN   | Full system access  |
| laboran@lab.com     | password123 | LABORAN | Lab management      |
| lecturer@lab.com    | password123 | DOSEN   | Room requests       |

---

## Implementation Steps

1. **Phase 1:** Update type definitions (user.types.ts)
2. **Phase 2:** Update API service (api.ts with interceptors)
3. **Phase 3:** Update auth service (auth.service.ts)
4. **Phase 4:** Update auth store (auth.store.ts)
5. **Phase 5:** Update route guards (guards.ts)
6. **Phase 6:** Update app initialization (main.ts/App.vue)
7. **Phase 7:** Update login page (Login.vue)
8. **Phase 8:** Test all authentication flows
9. **Phase 9:** Test all authorization scenarios
10. **Phase 10:** Update remaining pages to use real API

---

## Important Notes

⚠️ **Security:**
- Never log JWT tokens in production
- Use HTTPS in production
- Consider token refresh mechanism for better UX
- Implement proper error handling for all API calls

⚠️ **User Experience:**
- Show loading states during API calls
- Display clear error messages
- Persist authentication state across refreshes
- Redirect appropriately after login based on role

⚠️ **Backend API:**
- Backend is running on `http://localhost:3000`
- All protected endpoints require `Authorization: Bearer <token>`
- Public display endpoints don't require authentication
- Token expires in 1 day (configurable)

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login (public)
- `GET /api/auth/me` - Get current user (protected)

### Public Display
- `GET /api/display` - Aggregated display data
- `GET /api/display/laboratories` - Laboratory list
- `GET /api/display/schedules` - Today's schedules
- `GET /api/display/announcements` - Active announcements

### Protected Endpoints
See `backend/ENDPOINT_PROTECTION.md` for complete list.

---

## Completion Criteria

Frontend integration is complete when:

✅ Login with real API works for all roles  
✅ JWT token stored and included in requests  
✅ Session restoration works after refresh  
✅ Protected routes enforce authentication  
✅ Role-based access control works correctly  
✅ Logout clears state and redirects  
✅ API errors handled gracefully  
✅ All UI tests pass  

---

## Support

**Backend API Documentation:** http://localhost:3000/api  
**Backend Report:** `backend/PHASE_11_PART_2_IMPLEMENTATION_REPORT.md`  
**Endpoint Protection:** `backend/ENDPOINT_PROTECTION.md`

---

**Status:** Ready for frontend implementation  
**Last Updated:** August 13, 2026
