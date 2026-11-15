import { IsUUID, IsEmail, IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({
    description: 'Role ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  role_id: string;

  @ApiPropertyOptional({
    description: 'Keycloak user ID (UUID) - optional for custom auth',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  keycloak_id?: string;

  @ApiProperty({
    description: 'Full name of the user',
    example: 'Budi Santoso',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  full_name: string;

  @ApiProperty({
    description: 'Email address',
    example: 'budi@lab.com',
    maxLength: 16,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(16)
  email: string;

  @ApiProperty({
    description: 'Password',
    example: 'password123',
    minLength: 6,
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(15)
  password: string;

  @ApiPropertyOptional({
    description: 'Phone number',
    example: '+6281234567',
    maxLength: 11,
  })
  @IsOptional()
  @IsString()
  @MaxLength(11)
  phone?: string;

  @ApiProperty({
    description: 'User status',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status: UserStatus;

  @ApiPropertyOptional({
    description: 'Avatar photo URL',
    example: '/uploads/avatars/avatar-1725370000.png',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  avatar_url?: string;
}
