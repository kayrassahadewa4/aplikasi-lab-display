import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({
    description: 'Google ID Token / Credential from Google Identity Services or email in dev mode',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
  })
  @IsString()
  @IsNotEmpty()
  credential: string;

  @ApiProperty({
    description: 'Optional target role if auto-provisioning a new account (DOSEN or LABORAN)',
    required: false,
    example: 'DOSEN',
  })
  @IsString()
  @IsOptional()
  target_role?: string;

  @ApiProperty({
    description: 'Optional full name override if provided by client in dev mode',
    required: false,
    example: 'Dr. John Doe, M.Kom',
  })
  @IsString()
  @IsOptional()
  full_name?: string;

  @ApiProperty({
    description: 'Optional avatar URL from Google account',
    required: false,
    example: 'https://lh3.googleusercontent.com/a/default-user',
  })
  @IsString()
  @IsOptional()
  avatar_url?: string;
}
