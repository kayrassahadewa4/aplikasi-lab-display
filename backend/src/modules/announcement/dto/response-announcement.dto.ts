import { ApiProperty } from '@nestjs/swagger';

export class ResponseAnnouncementDto {
  @ApiProperty({
    description: 'Announcement ID',
    example: 'ee0e8400-e29b-41d4-a716-446655440009',
  })
  id: string;

  @ApiProperty({
    description: 'Announcement title',
    example: 'Laboratory Maintenance Schedule',
  })
  title: string;

  @ApiProperty({
    description: 'Announcement content',
    example:
      'All laboratories will be closed for maintenance on Saturday, January 20, 2024.',
  })
  content: string;

  @ApiProperty({
    description: 'Start date and time',
    example: '2024-01-15T00:00:00.000Z',
  })
  start_at: Date;

  @ApiProperty({
    description: 'End date and time',
    example: '2024-01-31T23:59:59.000Z',
  })
  end_at: Date;

  @ApiProperty({
    description: 'Is announcement active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updated_at: Date;
}
