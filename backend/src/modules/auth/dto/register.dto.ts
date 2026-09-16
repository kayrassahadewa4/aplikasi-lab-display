import { IsEmail, IsNotEmpty, IsString, MinLength, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Dr. Budi Santoso, M.Kom' })
  @IsString()
  @IsNotEmpty()
  full_name: string;

  @ApiProperty({ example: 'budi.santoso@univ.ac.id' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;

  @ApiPropertyOptional({ example: '+62 812-3456-7890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'DOSEN', enum: ['DOSEN', 'LABORAN'] })
  @IsString()
  @IsIn(['DOSEN', 'LABORAN'], { message: 'Role must be either DOSEN (Lecturer) or LABORAN (Lab Staff)' })
  role_code: 'DOSEN' | 'LABORAN';
}
