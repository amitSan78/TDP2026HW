import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '../ticket.entity';

export class UpdateTicketDto {
  @ApiPropertyOptional({ example: 'Login page crashes on Safari (fixed)', description: 'Updated ticket title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Root cause identified: missing null check', description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TicketStatus, example: TicketStatus.IN_PROGRESS, description: 'New status' })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority, example: TicketPriority.CRITICAL, description: 'New priority' })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', format: 'uuid', description: 'Reassign to this user UUID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ example: '2026-07-15T00:00:00.000Z', description: 'Updated due date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
