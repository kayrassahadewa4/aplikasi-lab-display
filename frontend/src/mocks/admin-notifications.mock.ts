export interface NotificationItem {
  id: string
  category: 'requests' | 'schedules' | 'announcements' | 'system' | string
  title: string
  description: string
  timestamp: string
  isUnread: boolean
  statusVariant: 'success' | 'warning' | 'danger' | 'info'
  linkPath?: string
}

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'requests',
    title: 'Room Request Approved',
    description: "John Doe's room request #REQ-204 for Software Engineering Lab (LAB-RPL) has been approved for Aug 12, 2026.",
    timestamp: '5 minutes ago',
    isUnread: true,
    statusVariant: 'success',
    linkPath: '/admin/room-requests',
  },
  {
    id: 'notif-2',
    category: 'requests',
    title: 'New Room Request Submitted',
    description: 'Dr. Sarah Connor submitted a new room request for Database Systems Lab (LAB-DB) on Aug 14, 2026.',
    timestamp: '15 minutes ago',
    isUnread: true,
    statusVariant: 'warning',
    linkPath: '/admin/room-requests',
  },
  {
    id: 'notif-3',
    category: 'schedules',
    title: 'Laboratory Schedule Created',
    description: 'Jane Smith created a new weekly recurring schedule for CS301 Web Programming Practicum in LAB-RPL.',
    timestamp: '1 hour ago',
    isUnread: true,
    statusVariant: 'info',
    linkPath: '/admin/schedules',
  },
  {
    id: 'notif-4',
    category: 'requests',
    title: 'Room Request Rejected',
    description: "Bob Wilson's room request #REQ-198 for Network Lab was rejected due to room schedule conflict.",
    timestamp: '2 hours ago',
    isUnread: true,
    statusVariant: 'danger',
    linkPath: '/admin/room-requests',
  },
  {
    id: 'notif-5',
    category: 'system',
    title: 'Public Display Sync Completed',
    description: 'Automatic synchronization between Master Schedule and Public Display Board completed with 0 errors.',
    timestamp: '4 hours ago',
    isUnread: true,
    statusVariant: 'success',
    linkPath: '/display',
  },
  {
    id: 'notif-6',
    category: 'system',
    title: 'New Public Announcement Ticker',
    description: "Administrator published public announcement: 'Mid-Semester Laboratory Examinations scheduled for August 15–20, 2026.'",
    timestamp: 'Yesterday at 03:20 PM',
    isUnread: false,
    statusVariant: 'info',
    linkPath: '/admin/announcements',
  },
]
