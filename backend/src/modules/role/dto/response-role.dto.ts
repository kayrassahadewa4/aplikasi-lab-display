import { ApiProperty } from '@nestjs/swagger';

export class ResponseRoleDto {
  @ApiProperty({
    description: 'Role ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Unique role code',
    example: 'ADMIN',
  })
  code: string;

  @ApiProperty({
    description: 'Role name',
    example: 'Administrator',
  })
  name: string;

  @ApiProperty({
    description: 'Role description',
    example: 'Administrator with full system access',
  })
  description: string;

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
