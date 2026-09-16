import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export enum ResolveAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ResolveResetRequestDto {
  @ApiProperty({
    description: 'Tindakan terhadap permohonan reset sandi (APPROVE atau REJECT)',
    enum: ResolveAction,
    example: ResolveAction.APPROVE,
  })
  @IsEnum(ResolveAction, { message: 'Action harus APPROVE atau REJECT' })
  @IsNotEmpty()
  action: ResolveAction;

  @ApiPropertyOptional({
    description: 'Kata sandi sementara (opsional, jika kosong sistem akan menghasilkan kata sandi acak)',
    example: 'UPNVJ-Lab#2026',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Kata sandi sementara minimal 6 karakter' })
  temp_password?: string;
}

export class DirectResetPasswordDto {
  @ApiPropertyOptional({
    description: 'Kata sandi baru (opsional, jika kosong sistem akan menghasilkan kata sandi acak)',
    example: 'UPNVJ-Lab#2026',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Kata sandi baru minimal 6 karakter' })
  new_password?: string;
}
