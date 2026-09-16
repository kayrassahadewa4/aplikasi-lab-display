import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiPropertyOptional({ description: 'User ID of the recipient. If omitted, sends to all admins/laboran.', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsOptional()
  @IsUUID()
  recipient_id?: string;

  @ApiProperty({ description: 'Subject of the message', example: 'Maintenance Inquiry' })
  @IsNotEmpty()
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Body text of the message' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ description: 'Attachment file URL if any' })
  @IsOptional()
  @IsString()
  attachment_url?: string;
}
