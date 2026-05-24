import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TicketPriority, TicketStatus, TicketType } from '../ticket.entity';

export class CreateTicketDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(TicketStatus)
  status: TicketStatus;

  @IsEnum(TicketPriority)
  priority: TicketPriority;

  @IsEnum(TicketType)
  type: TicketType;

  @IsUUID()
  projectId: string;

  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
