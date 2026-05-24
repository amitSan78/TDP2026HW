import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EscalationScheduler } from './escalation.scheduler';
import { Ticket, TicketStatus, TicketPriority } from '../tickets/ticket.entity';
import { AuditService } from '../audit/audit.service';

const mockTicketRepo = () => ({
  find: jest.fn(),
  save: jest.fn(),
});

const mockAuditService = () => ({
  log: jest.fn().mockResolvedValue(undefined),
});

describe('EscalationScheduler', () => {
  let scheduler: EscalationScheduler;
  let ticketRepo: ReturnType<typeof mockTicketRepo>;
  let auditService: ReturnType<typeof mockAuditService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscalationScheduler,
        { provide: getRepositoryToken(Ticket), useFactory: mockTicketRepo },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    scheduler = module.get<EscalationScheduler>(EscalationScheduler);
    ticketRepo = module.get(getRepositoryToken(Ticket));
    auditService = module.get(AuditService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('escalateOverdueTickets', () => {
    it('should escalate LOW priority to MEDIUM', async () => {
      const ticket = {
        id: 'ticket-1',
        priority: TicketPriority.LOW,
        status: TicketStatus.TODO,
        isOverdue: false,
        dueDate: new Date('2020-01-01'), // past date
      };
      ticketRepo.find.mockResolvedValue([ticket]);
      ticketRepo.save.mockResolvedValue({ ...ticket, priority: TicketPriority.MEDIUM });

      await scheduler.escalateOverdueTickets();

      expect(ticketRepo.save).toHaveBeenCalledTimes(1);
      expect(ticket.priority).toBe(TicketPriority.MEDIUM);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'AUTO_ESCALATE', actor: 'SYSTEM' }),
      );
    });

    it('should set isOverdue when reaching CRITICAL', async () => {
      const ticket = {
        id: 'ticket-1',
        priority: TicketPriority.HIGH,
        status: TicketStatus.TODO,
        isOverdue: false,
        dueDate: new Date('2020-01-01'),
      };
      ticketRepo.find.mockResolvedValue([ticket]);
      ticketRepo.save.mockResolvedValue({
        ...ticket,
        priority: TicketPriority.CRITICAL,
        isOverdue: true,
      });

      await scheduler.escalateOverdueTickets();

      expect(ticket.priority).toBe(TicketPriority.CRITICAL);
      expect(ticket.isOverdue).toBe(true);
    });

    it('should not escalate DONE tickets', async () => {
      const ticket = {
        id: 'ticket-1',
        priority: TicketPriority.LOW,
        status: TicketStatus.DONE,
        isOverdue: false,
        dueDate: new Date('2020-01-01'),
      };
      ticketRepo.find.mockResolvedValue([ticket]);

      await scheduler.escalateOverdueTickets();

      expect(ticketRepo.save).not.toHaveBeenCalled();
    });

    it('should not escalate tickets without dueDate', async () => {
      const ticket = {
        id: 'ticket-1',
        priority: TicketPriority.LOW,
        status: TicketStatus.TODO,
        isOverdue: false,
        dueDate: null,
      };
      ticketRepo.find.mockResolvedValue([ticket]);

      await scheduler.escalateOverdueTickets();

      expect(ticketRepo.save).not.toHaveBeenCalled();
    });

    it('should not escalate CRITICAL tickets further', async () => {
      const ticket = {
        id: 'ticket-1',
        priority: TicketPriority.CRITICAL,
        status: TicketStatus.TODO,
        isOverdue: false,
        dueDate: new Date('2020-01-01'),
      };
      ticketRepo.find.mockResolvedValue([ticket]);
      ticketRepo.save.mockResolvedValue({ ...ticket, isOverdue: true });

      await scheduler.escalateOverdueTickets();

      expect(ticket.priority).toBe(TicketPriority.CRITICAL);
      expect(ticket.isOverdue).toBe(true);
    });
  });
});