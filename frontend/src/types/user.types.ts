// User types for frontend authentication

export enum UserRole {
  ADMIN = 'ADMIN',
  LABORAN = 'LABORAN',
  DOSEN = 'DOSEN', // Internal role code (backend uses 'DOSEN', display label remains 'Lecturer')
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string | null
  status: UserStatus
  role: {
    code: UserRole
    name: string
  }
  created_at?: string
  updated_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface AuthResponse {
  accessToken: string
  user: User
}
