import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ForgotPasswordRequestDto {
  @ApiProperty({
    description: 'Email resmi akun terdaftar pengguna (Dosen/Laboran)',
    example: 'dosen@upnvj.ac.id',
  })
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @ApiPropertyOptional({
    description: 'Catatan tambahan atau alasan permohonan reset kata sandi',
    example: 'Lupa kata sandi sejak pergantian semester ganjil.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Catatan maksimal 500 karakter' })
  notes?: string;
}
