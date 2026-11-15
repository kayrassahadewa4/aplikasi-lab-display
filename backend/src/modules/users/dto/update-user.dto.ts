import { IsUUID, IsEmail, IsString, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Role ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID()
  role_id?: string;

  @ApiPropertyOptional({
    description: 'Keycloak user ID (UUID)',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  keycloak_id?: string;

  @ApiPropertyOptional({
    description: 'Full name of the user',
    example: 'Budi Santoso',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  full_name?: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'budi@lab.com',
    maxLength: 16,
  })
  @IsOptional()
  @IsEmail()
  @MaxLength(16)
  email?: string;

  @ApiPropertyOptional({
    description: 'Password (if updating)',
    example: 'newpassword123',
    minLength: 6,
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(15)
  password?: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+6281234567',
    maxLength: 11,
  })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  phone?: string;

  @ApiPropertyOptional({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Avatar photo URL',
    example: '/uploads/avatars/avatar-1725370000.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar_url?: string | null;
}
