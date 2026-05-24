import { Controller, Post } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';
import { EscalationScheduler } from './escalation.scheduler';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly scheduler: EscalationScheduler) {}

  // ADMIN only — manually trigger escalation for testing
  @Roles(UserRole.ADMIN)
  @Post('escalate')
  trigger() {
    return this.scheduler.triggerManually();
  }
}
