import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

class RoleInfo {
  @ApiProperty({
    description: 'Role ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

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

export class ResponseUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  id: string;

  @ApiProperty({
    description: 'Role ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  role_id: string;

  @ApiProperty({
    description: 'Keycloak user ID',
    example: '660e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  keycloak_id: string | null;

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
    description: 'Phone number',
    example: '+62812345678',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: 'Avatar photo URL',
    example: '/uploads/avatars/avatar-1725370000.png',
    nullable: true,
  })
  avatar_url: string | null;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updated_at: Date;

  @ApiProperty({
    description: 'Role information',
    type: RoleInfo,
  })
  role: RoleInfo;
}
