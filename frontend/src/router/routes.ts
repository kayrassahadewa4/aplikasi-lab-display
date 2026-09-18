import type { RouteRecordRaw } from 'vue-router'
import { requireAuth, adminOnly, laboranOnly, lecturerOnly, guestOnly } from './guards'

export const routes: RouteRecordRaw[] = [
  // Root redirect - will redirect based on auth status
  {
    path: '/',
    redirect: '/login',
  },

  // Auth Routes (Guest Only)
  {
    path: '/auth',
    component: () => import('@/layouts/AuthLayout.vue'),
    beforeEnter: guestOnly,
    children: [
      {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/LoginView.vue'),
        alias: '/auth/login',
      },
      {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/RegisterView.vue'),
        alias: '/auth/register',
      },
    ],
  },

  // Admin Portal Routes (Requires Admin Role)
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    beforeEnter: adminOnly,
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/DashboardPage.vue'),
      },
      {
        path: 'roles',
        name: 'AdminRoles',
        component: () => import('@/views/admin/RolesPage.vue'),
      },
      {
        path: 'roles/create',
        name: 'AdminRoleCreate',
        component: () => import('@/views/admin/RoleFormPage.vue'),
      },
      {
        path: 'roles/:id',
        name: 'AdminRoleDetail',
        component: () => import('@/views/admin/RoleDetailPage.vue'),
      },
      {
        path: 'roles/:id/edit',
        name: 'AdminRoleEdit',
        component: () => import('@/views/admin/RoleFormPage.vue'),
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/UsersPage.vue'),
      },
      {
        path: 'users/create',
        name: 'AdminUserCreate',
        component: () => import('@/views/admin/UserFormPage.vue'),
      },
      {
        path: 'users/:id',
        name: 'AdminUserDetail',
        component: () => import('@/views/admin/UserDetailPage.vue'),
      },
      {
        path: 'users/:id/edit',
        name: 'AdminUserEdit',
        component: () => import('@/views/admin/UserFormPage.vue'),
      },
      {
        path: 'laboratories',
        name: 'AdminLaboratories',
        component: () => import('@/views/admin/LaboratoriesPage.vue'),
      },
      {
        path: 'laboratories/create',
        name: 'AdminLaboratoryCreate',
        component: () => import('@/views/admin/LaboratoryFormPage.vue'),
      },
      {
        path: 'laboratories/:id',
        name: 'AdminLaboratoryDetail',
        component: () => import('@/views/admin/LaboratoryDetailPage.vue'),
      },
      {
        path: 'laboratories/:id/edit',
        name: 'AdminLaboratoryEdit',
        component: () => import('@/views/admin/LaboratoryFormPage.vue'),
      },
      {
        path: 'facilities',
        name: 'AdminFacilities',
        component: () => import('@/views/admin/FacilitiesPage.vue'),
      },
      {
        path: 'facilities/create',
        name: 'AdminFacilityCreate',
        component: () => import('@/views/admin/FacilityFormPage.vue'),
      },
      {
        path: 'facilities/:id',
        name: 'AdminFacilityDetail',
        component: () => import('@/views/admin/FacilityDetailPage.vue'),
      },
      {
        path: 'facilities/:id/edit',
        name: 'AdminFacilityEdit',
        component: () => import('@/views/admin/FacilityFormPage.vue'),
      },
      {
        path: 'issue-tickets',
        name: 'AdminIssueTickets',
        component: () => import('@/views/shared/IssueTicketsPage.vue'),
      },
      {
        path: 'maintenance-logs',
        name: 'AdminMaintenanceLogs',
        component: () => import('@/views/shared/MaintenanceLogsPage.vue'),
      },
      {
        path: 'academic-calendars',
        name: 'AdminAcademicCalendars',
        component: () => import('@/views/admin/AcademicCalendarsPage.vue'),
      },
      {
        path: 'academic-calendars/create',
        name: 'AdminAcademicCalendarCreate',
        component: () => import('@/views/admin/AcademicCalendarFormPage.vue'),
      },
      {
        path: 'academic-calendars/:id',
        name: 'AdminAcademicCalendarDetail',
        component: () => import('@/views/admin/AcademicCalendarDetailPage.vue'),
      },
      {
        path: 'academic-calendars/:id/edit',
        name: 'AdminAcademicCalendarEdit',
        component: () => import('@/views/admin/AcademicCalendarFormPage.vue'),
      },
      {
        path: 'operational-hours',
        name: 'AdminOperationalHours',
        component: () => import('@/views/admin/OperationalHoursPage.vue'),
      },
      {
        path: 'operational-hours/create',
        name: 'AdminOperationalHoursCreate',
        component: () => import('@/views/admin/OperationalHoursFormPage.vue'),
      },
      {
        path: 'operational-hours/:id/edit',
        name: 'AdminOperationalHoursEdit',
        component: () => import('@/views/admin/OperationalHoursFormPage.vue'),
      },
      {
        path: 'announcements',
        name: 'AdminAnnouncements',
        component: () => import('@/views/admin/AnnouncementsPage.vue'),
      },
      {
        path: 'announcements/create',
        name: 'AdminAnnouncementCreate',
        component: () => import('@/views/admin/AnnouncementFormPage.vue'),
      },
      {
        path: 'announcements/:id',
        name: 'AdminAnnouncementDetail',
        component: () => import('@/views/admin/AnnouncementDetailPage.vue'),
      },
      {
        path: 'announcements/:id/edit',
        name: 'AdminAnnouncementEdit',
        component: () => import('@/views/admin/AnnouncementFormPage.vue'),
      },
      {
        path: 'schedules',
        name: 'AdminSchedules',
        component: () => import('@/views/admin/SchedulesPage.vue'),
      },
      {
        path: 'schedules/create',
        name: 'AdminScheduleCreate',
        component: () => import('@/views/admin/ScheduleFormPage.vue'),
      },
      {
        path: 'schedules/:id',
        name: 'AdminScheduleDetail',
        component: () => import('@/views/admin/ScheduleDetailPage.vue'),
      },
      {
        path: 'schedules/:id/edit',
        name: 'AdminScheduleEdit',
        component: () => import('@/views/admin/ScheduleFormPage.vue'),
      },
      {
        path: 'room-requests',
        name: 'AdminRoomRequests',
        component: () => import('@/views/admin/RoomRequestsPage.vue'),
      },
      {
        path: 'room-requests/create',
        name: 'AdminRoomRequestCreate',
        component: () => import('@/views/admin/RoomRequestFormPage.vue'),
      },
      {
        path: 'room-requests/:id',
        name: 'AdminRoomRequestDetail',
        component: () => import('@/views/admin/RoomRequestDetailPage.vue'),
      },
      {
        path: 'room-requests/:id/review',
        name: 'AdminRoomRequestReview',
        component: () => import('@/views/admin/RoomRequestReviewPage.vue'),
      },
      {
        path: 'room-usage',
        name: 'AdminRoomUsage',
        component: () => import('@/views/admin/RoomUsagePage.vue'),
      },
      {
        path: 'room-usage/create',
        name: 'AdminRoomUsageCreate',
        component: () => import('@/views/admin/RoomUsageFormPage.vue'),
      },
      {
        path: 'room-usage/:id',
        name: 'AdminRoomUsageDetail',
        component: () => import('@/views/admin/RoomUsageDetailPage.vue'),
      },
      {
        path: 'room-usage/:id/edit',
        name: 'AdminRoomUsageEdit',
        component: () => import('@/views/admin/RoomUsageFormPage.vue'),
      },
      {
        path: 'reports',
        name: 'AdminReports',
        component: () => import('@/views/admin/ReportsPage.vue'),
      },
      {
        path: 'settings',
        name: 'AdminSettings',
        component: () => import('@/views/admin/SettingsPage.vue'),
      },

      {
        path: 'notifications',
        name: 'AdminNotifications',
        component: () => import('@/views/admin/NotificationsPage.vue'),
      },
      {
        path: 'profile',
        name: 'AdminProfile',
        component: () => import('@/views/admin/ProfilePage.vue'),
      },
      {
        path: 'profile/edit',
        name: 'AdminProfileEdit',
        component: () => import('@/views/admin/ProfileEditPage.vue'),
      },
      {
        path: 'profile/change-password',
        name: 'AdminProfileChangePassword',
        component: () => import('@/views/admin/ProfileChangePasswordPage.vue'),
      },
    ],
  },
  {
    path: '/profile',
    redirect: '/admin/profile',
  },
  {
    path: '/profile/edit',
    redirect: '/admin/profile/edit',
  },
  {
    path: '/profile/change-password',
    redirect: '/admin/profile/change-password',
  },

  // Laboran (Laboratory Staff) Portal Routes (Requires Laboran Role)
  {
    path: '/laboran',
    component: () => import('@/layouts/LaboranLayout.vue'),
    beforeEnter: laboranOnly,
    children: [
      {
        path: '',
        name: 'LaboranDashboard',
        component: () => import('@/views/laboran/DashboardPage.vue'),
      },
      {
        path: 'issue-tickets',
        name: 'LaboranIssueTickets',
        component: () => import('@/views/shared/IssueTicketsPage.vue'),
      },
      {
        path: 'maintenance-logs',
        name: 'LaboranMaintenanceLogs',
        component: () => import('@/views/shared/MaintenanceLogsPage.vue'),
      },
      {
        path: 'room-requests',
        name: 'LaboranRoomRequests',
        component: () => import('@/views/laboran/RoomRequestsPage.vue'),
      },
      {
        path: 'room-requests/:id',
        name: 'LaboranRoomRequestDetail',
        component: () => import('@/views/laboran/RoomRequestDetailPage.vue'),
      },
      {
        path: 'schedules',
        name: 'LaboranSchedules',
        component: () => import('@/views/laboran/SchedulesPage.vue'),
      },
      {
        path: 'schedules/:id',
        name: 'LaboranScheduleDetail',
        component: () => import('@/views/laboran/ScheduleDetailPage.vue'),
      },
      {
        path: 'room-usage',
        name: 'LaboranRoomUsage',
        component: () => import('@/views/laboran/RoomUsagePage.vue'),
      },
      {
        path: 'room-usage/:id',
        name: 'LaboranRoomUsageDetail',
        component: () => import('@/views/laboran/RoomUsageDetailPage.vue'),
      },
      {
        path: 'laboratories',
        name: 'LaboranLaboratories',
        component: () => import('@/views/laboran/LaboratoriesPage.vue'),
      },
      {
        path: 'laboratories/:id',
        name: 'LaboranLaboratoryDetail',
        component: () => import('@/views/laboran/LaboratoryDetailPage.vue'),
      },
      {
        path: 'announcements',
        name: 'LaboranAnnouncements',
        component: () => import('@/views/laboran/AnnouncementsPage.vue'),
      },
      {
        path: 'announcements/:id',
        name: 'LaboranAnnouncementDetail',
        component: () => import('@/views/laboran/AnnouncementDetailPage.vue'),
      },
      {
        path: 'reports',
        name: 'LaboranReports',
        component: () => import('@/views/laboran/ReportsPage.vue'),
      },
      {
        path: 'notifications',
        name: 'LaboranNotifications',
        component: () => import('@/views/laboran/NotificationsPage.vue'),
      },
      {
        path: 'settings',
        name: 'LaboranSettings',
        component: () => import('@/views/laboran/SettingsPage.vue'),
      },
      {
        path: 'settings/profile',
        name: 'LaboranSettingsProfile',
        component: () => import('@/views/laboran/SettingsPage.vue'),
      },
      {
        path: 'settings/profile/edit',
        name: 'LaboranSettingsProfileEdit',
        component: () => import('@/views/laboran/SettingsPage.vue'),
      },
      {
        path: 'settings/security',
        name: 'LaboranSettingsSecurity',
        component: () => import('@/views/laboran/SettingsPage.vue'),
      },
      {
        path: 'settings/preferences',
        name: 'LaboranSettingsPreferences',
        component: () => import('@/views/laboran/SettingsPage.vue'),
      },
      {
        path: 'settings/activity-history',
        name: 'LaboranSettingsActivityHistory',
        component: () => import('@/views/laboran/SettingsPage.vue'),
      },
      {
        path: 'activity',
        redirect: '/laboran/settings/activity-history',
      },
      {
        path: 'profile',
        redirect: '/laboran/settings/profile',
      },
    ],
  },

  // Lecturer/Applicant Portal Routes (Requires Lecturer Role)
  {
    path: '/lecturer',
    component: () => import('@/layouts/LecturerLayout.vue'),
    beforeEnter: lecturerOnly,
    children: [
      {
        path: '',
        name: 'LecturerDashboard',
        component: () => import('@/views/lecturer/DashboardPage.vue'),
      },
      {
        path: 'issue-tickets',
        name: 'LecturerIssueTickets',
        component: () => import('@/views/shared/IssueTicketsPage.vue'),
      },
      {
        path: 'schedules',
        name: 'LecturerSchedules',
        component: () => import('@/views/lecturer/SchedulesPage.vue'),
      },
      {
        path: 'schedules/:id',
        name: 'LecturerScheduleDetail',
        component: () => import('@/views/lecturer/ScheduleDetailPage.vue'),
      },
      {
        path: 'room-requests',
        name: 'LecturerRoomRequests',
        component: () => import('@/views/lecturer/RoomRequestsPage.vue'),
      },
      {
        path: 'room-requests/new',
        name: 'LecturerNewRoomRequest',
        component: () => import('@/views/lecturer/NewRoomRequestPage.vue'),
      },
      {
        path: 'room-requests/:id',
        name: 'LecturerRoomRequestDetail',
        component: () => import('@/views/lecturer/RoomRequestDetailPage.vue'),
      },
      {
        path: 'laboratories',
        name: 'LecturerLaboratories',
        component: () => import('@/views/lecturer/LaboratoriesPage.vue'),
      },
      {
        path: 'laboratories/:id',
        name: 'LecturerLaboratoryDetail',
        component: () => import('@/views/lecturer/LaboratoryDetailPage.vue'),
      },
      {
        path: 'settings',
        name: 'LecturerSettings',
        component: () => import('@/views/lecturer/SettingsPage.vue'),
      },
      {
        path: 'settings/profile',
        name: 'LecturerSettingsProfile',
        component: () => import('@/views/lecturer/SettingsPage.vue'),
      },
      {
        path: 'settings/profile/edit',
        name: 'LecturerSettingsProfileEdit',
        component: () => import('@/views/lecturer/SettingsPage.vue'),
      },
      {
        path: 'settings/security',
        name: 'LecturerSettingsSecurity',
        component: () => import('@/views/lecturer/SettingsPage.vue'),
      },
      {
        path: 'settings/password',
        name: 'LecturerSettingsPassword',
        component: () => import('@/views/lecturer/SettingsPage.vue'),
      },
      {
        path: 'settings/preferences',
        name: 'LecturerSettingsPreferences',
        component: () => import('@/views/lecturer/SettingsPage.vue'),
      },
    ],
  },

  // Public Display Portal Routes (No Auth Required - Full Screen)
  {
    path: '/display',
    component: () => import('@/layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'PublicDisplay',
        component: () => import('@/views/public/DisplayPage.vue'),
      },
    ],
  },

  // 404 Not Found
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFoundPage.vue'),
  },
]
