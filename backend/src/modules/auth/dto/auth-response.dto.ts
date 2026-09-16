import { ApiProperty } from '@nestjs/swagger';

class RoleInfo {
  @ApiProperty({
    description: 'Role code',
    example: 'ADMIN',
  })
  code: string;

  @ApiProperty({
    description: 'Role name',
    example: 'Administrator',
  })
  name: string;
}

class UserInfo {
  @ApiProperty({
    description: 'User ID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  id: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
  })
  full_name: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User status',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Avatar photo URL',
    example: '/uploads/avatars/avatar-1725370000.png',
    nullable: true,
  })
  avatar_url: string | null;

  @ApiProperty({
    description: 'Role information',
    type: RoleInfo,
  })
  role: RoleInfo;
}

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Authenticated user information',
    type: UserInfo,
  })
  user: UserInfo;
}
