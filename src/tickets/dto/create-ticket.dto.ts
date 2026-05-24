import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TicketPriority, TicketStatus, TicketType } from '../ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ example: 'Login page crashes on Safari', description: 'Short title of the ticket' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Steps to reproduce: open Safari, navigate to /login, click Submit', description: 'Detailed description of the issue or feature' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.TODO, description: 'Current status of the ticket' })
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.HIGH, description: 'Priority level' })
  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @ApiProperty({ enum: TicketType, example: TicketType.BUG, description: 'Type of work' })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', format: 'uuid', description: 'UUID of the project this ticket belongs to' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001', format: 'uuid', description: 'UUID of the user assigned to this ticket' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ example: '2026-06-30T00:00:00.000Z', description: 'ISO 8601 due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
