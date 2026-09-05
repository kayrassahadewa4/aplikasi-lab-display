export interface MessageItem {
  id: string
  senderName: string
  senderRole: string
  email: string
  avatarInitial: string
  subject: string
  preview: string
  body: string
  timestamp: string
  isUnread: boolean
  folder: 'inbox' | 'sent' | 'archived'
  hasAttachment?: boolean
  attachmentName?: string
}

export const mockMessages: MessageItem[] = [
  {
    id: 'msg-1',
    senderName: 'Dr. Sarah Connor',
    senderRole: 'Dosen / Pemohon',
    email: 'sarah.connor@fik.upn.ac.id',
    avatarInitial: 'S',
    subject: 'Computer Laboratory A Availability Request',
    preview: 'Could you please confirm if Tuesday 08:00 – 10:00 is clear for reservation?',
    body: `Hello Administrator,

I would like to inquire about the availability of Computer Laboratory A for next week's Web Programming practical exam. We require 35 working workstations with Docker and Node.js pre-installed.

Could you please confirm if Tuesday 08:00 – 10:00 is clear for reservation?

Best regards,
Dr. Sarah Connor`,
    timestamp: 'Today, 10:24 AM',
    isUnread: true,
    folder: 'inbox',
    hasAttachment: true,
    attachmentName: 'exam_schedule_req.pdf',
  },
  {
    id: 'msg-2',
    senderName: 'Jane Smith',
    senderRole: 'Laboran',
    email: 'jane.smith@lab.com',
    avatarInitial: 'J',
    subject: 'Schedule Update Confirmation — CS301',
    preview: 'The recurring weekly schedule for CS301 Web Programming Practicum in Lab RPL has been updated.',
    body: `Hello Admin,

The recurring weekly schedule for CS301 Web Programming Practicum in Lab RPL has been updated. All lab assistants have been notified and room keys allocated.

Thank you,
Jane Smith`,
    timestamp: 'Today, 09:42 AM',
    isUnread: true,
    folder: 'inbox',
  },
  {
    id: 'msg-3',
    senderName: 'Prof. Michael Scott',
    senderRole: 'Dosen / Pemohon',
    email: 'michael.scott@fik.upn.ac.id',
    avatarInitial: 'M',
    subject: 'Database Lab Storage & GPU Node Request',
    preview: 'Our Database Systems class will be executing large SQL indexing scripts and GPU-based query benchmarking...',
    body: `Dear Admin Portal Team,

Our Database Systems class will be executing large SQL indexing scripts and GPU-based query benchmarking in Lab DB tomorrow afternoon.

Please verify if the secondary storage node is online and accessible for student accounts.

Regards,
Prof. Michael Scott`,
    timestamp: 'Yesterday, 04:15 PM',
    isUnread: true,
    folder: 'inbox',
  },
  {
    id: 'msg-4',
    senderName: 'Budi Santoso, M.T',
    senderRole: 'Laboran',
    email: 'budi.santoso@lab.com',
    avatarInitial: 'B',
    subject: 'Maintenance Completion Report — Network Lab Router #3',
    preview: 'Routine maintenance and firmware upgrading for Cisco Router #3 in Network Lab has been completed.',
    body: `Admin Team,

Routine maintenance and firmware upgrading for Cisco Router #3 in Network Lab (LAB-JAR) has been completed successfully.

All interfaces are operational and live traffic monitoring is restored.`,
    timestamp: 'Aug 07, 2026',
    isUnread: false,
    folder: 'inbox',
  },
  {
    id: 'msg-5',
    senderName: 'Dewi Lestari, S.T, M.Ds',
    senderRole: 'Dosen / Pemohon',
    email: 'dewi.lestari@fik.upn.ac.id',
    avatarInitial: 'D',
    subject: '3D Graphics Tablet Facility Inquiry',
    preview: 'We have received 5 new Wacom drawing tablets for Multimedia Lab (LAB-MM).',
    body: `Hi Admin,

We have received 5 new Wacom drawing tablets for Multimedia Lab (LAB-MM). I have created a facility update log for your review.

Best,
Dewi Lestari`,
    timestamp: 'Aug 05, 2026',
    isUnread: false,
    folder: 'inbox',
  },
]

export const getMessageById = (id: string): MessageItem | undefined => {
  return mockMessages.find(m => m.id === id)
}

export const addReplyMessage = (toEmail: string, recipientName: string, subject: string, body: string): MessageItem => {
  const newMsg: MessageItem = {
    id: `msg-reply-${Date.now()}`,
    senderName: 'Administrator',
    senderRole: 'Administrator',
    email: toEmail,
    avatarInitial: 'A',
    subject: subject.startsWith('Re:') ? subject : `Re: ${subject}`,
    preview: body.slice(0, 80) + '...',
    body,
    timestamp: 'Just now',
    isUnread: false,
    folder: 'sent',
  }
  mockMessages.unshift(newMsg)
  return newMsg
}
