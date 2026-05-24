import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'IssueFlow v2', description: 'New project name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Revamped API', description: 'New project description' })
  @IsOptional()
  @IsString()
  description?: string;
}
