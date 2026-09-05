// Router navigation guards
import type { NavigationGuardNext, RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '@/stores'
import { UserRole } from '@/types'

/**
 * Require authentication to access route
 */
export const requireAuth = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Initialize auth store if not done
  await authStore.initialize()

  if (!authStore.isAuthenticated) {
    // Redirect to login with return URL
    next({
      name: 'Login',
      query: { redirect: to.fullPath },
    })
  } else {
    next()
  }
}

/**
 * Only allow guests (unauthenticated users)
 */
export const guestOnly = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Initialize auth store if not done
  await authStore.initialize()

  if (authStore.isAuthenticated) {
    // Redirect authenticated users based on their role
    const redirectPath = getDefaultRouteByRole(authStore.userRole)
    next(redirectPath)
  } else {
    next()
  }
}

/**
 * Require admin role
 */
export const adminOnly = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Initialize auth store if not done
  await authStore.initialize()

  if (!authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (authStore.userRole !== UserRole.ADMIN) {
    // Unauthorized - redirect to their default dashboard
    const redirectPath = getDefaultRouteByRole(authStore.userRole)
    next(redirectPath)
  } else {
    next()
  }
}

/**
 * Require laboran role
 */
export const laboranOnly = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Initialize auth store if not done
  await authStore.initialize()

  if (!authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (authStore.userRole !== UserRole.LABORAN) {
    // Unauthorized - redirect to their default dashboard
    const redirectPath = getDefaultRouteByRole(authStore.userRole)
    next(redirectPath)
  } else {
    next()
  }
}

/**
 * Require lecturer/dosen role
 */
export const lecturerOnly = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
) => {
  const authStore = useAuthStore()

  // Initialize auth store if not done
  await authStore.initialize()

  if (!authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (authStore.userRole !== UserRole.DOSEN) {
    // Unauthorized - redirect to their default dashboard
    const redirectPath = getDefaultRouteByRole(authStore.userRole)
    next(redirectPath)
  } else {
    next()
  }
}

/**
 * Get default route based on user role
 */
function getDefaultRouteByRole(role: string | null): string {
  switch (role) {
    case UserRole.ADMIN:
      return '/admin'
    case UserRole.LABORAN:
      return '/laboran'
    case UserRole.DOSEN:
      return '/lecturer' // Route path remains '/lecturer' for display consistency
    default:
      return '/login'
  }
}

/**
 * Helper to redirect authenticated users to their dashboard
 */
export function redirectToDashboard(role: string | null): string {
  return getDefaultRouteByRole(role)
}
