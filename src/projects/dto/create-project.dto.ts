import { IsString, IsUUID, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'IssueFlow Backend', description: 'Project name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Core API for the IssueFlow platform', description: 'Optional project description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', format: 'uuid', description: 'UUID of the user who owns this project' })
  @IsUUID()
  ownerId: string;
}
