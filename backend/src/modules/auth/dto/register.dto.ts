import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Dr. Budi Santoso', maxLength: 50 })
  @IsString()
  @IsNotEmpty({ message: 'Nama lengkap tidak boleh kosong' })
  @MaxLength(50, { message: 'Nama lengkap maksimal 50 karakter' })
  full_name: string;

  @ApiProperty({ example: 'budi@univ.ac.id', maxLength: 16 })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  @MaxLength(16, { message: 'Email maksimal 16 karakter' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8, maxLength: 15 })
  @IsString()
  @MinLength(8, { message: 'Kata sandi minimal 8 karakter' })
  @MaxLength(15, { message: 'Kata sandi maksimal 15 karakter' })
  password: string;

  @ApiPropertyOptional({ example: '+6281234567', maxLength: 11 })
  @IsString()
  @IsOptional()
  @MaxLength(11, { message: 'Nomor telepon maksimal 11 karakter' })
  phone?: string;

  @ApiProperty({ example: 'DOSEN', enum: ['DOSEN', 'LABORAN'] })
  @IsString()
  @IsIn(['DOSEN', 'LABORAN'], { message: 'Role harus berupa DOSEN atau LABORAN' })
  role_code: 'DOSEN' | 'LABORAN';
}
