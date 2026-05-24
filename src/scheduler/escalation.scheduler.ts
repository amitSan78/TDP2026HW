import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Ticket, TicketStatus, TicketPriority } from '../tickets/ticket.entity';
import { AuditService } from '../audit/audit.service';

// Defines the escalation order
const PRIORITY_ORDER = [
  TicketPriority.LOW,
  TicketPriority.MEDIUM,
  TicketPriority.HIGH,
  TicketPriority.CRITICAL,
];

@Injectable()
export class EscalationScheduler {
  private readonly logger = new Logger(EscalationScheduler.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    private readonly auditService: AuditService,
  ) {}

  // Runs every hour automatically
  @Cron(CronExpression.EVERY_HOUR)
  async escalateOverdueTickets() {
    this.logger.log('Running escalation check...');

    // Find all non-DONE tickets with a dueDate in the past
    const overdueTickets = await this.ticketsRepo.find({
      where: {
        dueDate: LessThan(new Date()),
        isOverdue: false,
      },
    });

    // Filter out DONE tickets
    const tickets = overdueTickets.filter(
      (t) => t.status !== TicketStatus.DONE && t.dueDate !== null,
    );

    this.logger.log(`Found ${tickets.length} overdue tickets`);

    for (const ticket of tickets) {
      const currentIndex = PRIORITY_ORDER.indexOf(ticket.priority);

      // Already CRITICAL — just set isOverdue flag
      if (ticket.priority === TicketPriority.CRITICAL) {
        ticket.isOverdue = true;
        await this.ticketsRepo.save(ticket);

        await this.auditService.log({
          actor: 'SYSTEM',
          action: 'AUTO_ESCALATE',
          entityType: 'ticket',
          entityId: ticket.id,
          payload: {
            priority: ticket.priority,
            isOverdue: true,
          },
        });
        continue;
      }

      // Promote priority one level
      const newPriority = PRIORITY_ORDER[currentIndex + 1];
      const oldPriority = ticket.priority;
      ticket.priority = newPriority;

      // Set isOverdue if reaching CRITICAL
      if (newPriority === TicketPriority.CRITICAL) {
        ticket.isOverdue = true;
      }

      await this.ticketsRepo.save(ticket);

      await this.auditService.log({
        actor: 'SYSTEM',
        action: 'AUTO_ESCALATE',
        entityType: 'ticket',
        entityId: ticket.id,
        payload: {
          oldPriority,
          newPriority,
          isOverdue: ticket.isOverdue,
        },
      });

      this.logger.log(
        `Escalated ticket ${ticket.id}: ${oldPriority} → ${newPriority}`,
      );
    }
  }
  async triggerManually(): Promise<{ message: string }> {
  await this.escalateOverdueTickets();
  return { message: 'Escalation check completed' };
}
}