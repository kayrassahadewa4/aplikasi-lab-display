import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'admin@lab.com',
    maxLength: 16,
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @MaxLength(16, { message: 'Email maksimal 16 karakter' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi tidak boleh kosong' })
  @MinLength(6, { message: 'Kata sandi minimal 6 karakter' })
  @MaxLength(15, { message: 'Kata sandi maksimal 15 karakter' })
  password: string;
}
