import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ description: 'User ID of the notification recipient' })
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @ApiProperty({ description: 'Notification title', example: 'New Room Request' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification content message' })
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ description: 'Notification category', example: 'requests' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ description: 'Target navigation link URL', example: '/admin/room-requests/123' })
  @IsOptional()
  @IsString()
  link_url?: string;
}
