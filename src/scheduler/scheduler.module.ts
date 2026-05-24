import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscalationScheduler } from './escalation.scheduler';
import { SchedulerController } from './scheduler.controller';
import { Ticket } from '../tickets/ticket.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket]), AuditModule],
  controllers: [SchedulerController],
  providers: [EscalationScheduler],
})
export class SchedulerModule {}
