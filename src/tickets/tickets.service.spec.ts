import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  TicketType,
} from './ticket.entity';
import { TicketDependency } from './ticket-dependency.entity';
import { User, UserRole } from '../users/user.entity';
import { AuditService } from '../audit/audit.service';

const mockTicketRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  count: jest.fn(),
  softRemove: jest.fn(),
  restore: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const mockDepsRepo = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

const mockUserRepo = () => ({
  find: jest.fn(),
});

const mockAuditService = () => ({
  log: jest.fn().mockResolvedValue(undefined),
});

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepo: ReturnType<typeof mockTicketRepo>;
  let depsRepo: ReturnType<typeof mockDepsRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getRepositoryToken(Ticket), useFactory: mockTicketRepo },
        {
          provide: getRepositoryToken(TicketDependency),
          useFactory: mockDepsRepo,
        },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
        { provide: AuditService, useFactory: mockAuditService },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketRepo = module.get(getRepositoryToken(Ticket));
    depsRepo = module.get(getRepositoryToken(TicketDependency));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      title: 'Fix bug',
      status: TicketStatus.TODO,
      priority: TicketPriority.HIGH,
      type: TicketType.BUG,
      projectId: 'proj-1',
      assigneeId: 'user-1',
    };

    it('should create ticket with provided assignee', async () => {
      ticketRepo.create.mockReturnValue(dto);
      ticketRepo.save.mockResolvedValue({ id: 'ticket-1', ...dto });

      const result = await service.create(dto);
      expect(result.id).toBe('ticket-1');
      expect(ticketRepo.save).toHaveBeenCalledTimes(1);
    });

    it('should auto-assign when no assigneeId provided', async () => {
      const { assigneeId, ...dtoWithoutAssignee } = dto;
      userRepo.find.mockResolvedValue([
        { id: 'dev-1', role: UserRole.DEVELOPER, createdAt: new Date() },
      ]);
      ticketRepo.count.mockResolvedValue(0);
      ticketRepo.create.mockReturnValue(dtoWithoutAssignee);
      ticketRepo.save.mockResolvedValue({
        id: 'ticket-1',
        assigneeId: 'dev-1',
        ...dtoWithoutAssignee,
      });

      await service.create(dtoWithoutAssignee);
      expect(ticketRepo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('update', () => {
    it('should throw BadRequestException when updating DONE ticket', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.DONE,
        version: 1,
      });
      await expect(
        service.update('ticket-1', { title: 'New title' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on backward status transition', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.IN_PROGRESS,
        version: 1,
      });
      await expect(
        service.update('ticket-1', { status: TicketStatus.TODO }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow forward status transition', async () => {
      const ticket = {
        id: 'ticket-1',
        status: TicketStatus.TODO,
        version: 1,
      };
      ticketRepo.findOne.mockResolvedValue(ticket);
      depsRepo.find.mockResolvedValue([]);
      ticketRepo.save.mockResolvedValue({
        ...ticket,
        status: TicketStatus.IN_PROGRESS,
      });

      const result = await service.update('ticket-1', {
        status: TicketStatus.IN_PROGRESS,
      });
      expect(result.status).toBe(TicketStatus.IN_PROGRESS);
    });

    it('should reset isOverdue when priority is manually changed', async () => {
      const ticket = {
        id: 'ticket-1',
        status: TicketStatus.TODO,
        isOverdue: true,
        version: 1,
      };
      ticketRepo.findOne.mockResolvedValue(ticket);
      depsRepo.find.mockResolvedValue([]);
      ticketRepo.save.mockResolvedValue({
        ...ticket,
        priority: TicketPriority.HIGH,
        isOverdue: false,
      });

      await service.update('ticket-1', { priority: TicketPriority.HIGH });
      expect(ticket.isOverdue).toBe(false);
    });

    it('should throw BadRequestException if ticket has unresolved blockers when moving to DONE', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 'ticket-1',
        status: TicketStatus.IN_REVIEW,
        version: 1,
      });
      depsRepo.find.mockResolvedValue([
        {
          blockedBy: { id: 'blocker-1', status: TicketStatus.IN_PROGRESS },
        },
      ]);

      await expect(
        service.update('ticket-1', { status: TicketStatus.DONE }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return ticket when found', async () => {
      ticketRepo.findOne.mockResolvedValue({
        id: 'ticket-1',
        title: 'Fix bug',
      });
      const result = await service.findOne('ticket-1');
      expect(result.title).toBe('Fix bug');
    });

    it('should throw NotFoundException when not found', async () => {
      ticketRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addDependency', () => {
    it('should throw BadRequestException if ticket blocks itself', async () => {
      await expect(
        service.addDependency('ticket-1', 'ticket-1'),
      ).rejects.toThrow(BadRequestException);
    });
    it('should throw BadRequestException if tickets are in different projects', async () => {
      ticketRepo.findOne
        .mockResolvedValueOnce({ id: 'ticket-1', projectId: 'proj-1' })
        .mockResolvedValueOnce({ id: 'ticket-2', projectId: 'proj-2' });

      await expect(
        service.addDependency('ticket-1', 'ticket-2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if dependency already exists', async () => {
      ticketRepo.findOne
        .mockResolvedValueOnce({ id: 'ticket-1', projectId: 'proj-1' })
        .mockResolvedValueOnce({ id: 'ticket-2', projectId: 'proj-1' });
      depsRepo.findOne.mockResolvedValue({ id: 'dep-1' });

      await expect(
        service.addDependency('ticket-1', 'ticket-2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create dependency when valid', async () => {
      ticketRepo.findOne
        .mockResolvedValueOnce({ id: 'ticket-1', projectId: 'proj-1' })
        .mockResolvedValueOnce({ id: 'ticket-2', projectId: 'proj-1' });
      depsRepo.findOne.mockResolvedValue(null);
      depsRepo.create.mockReturnValue({
        ticketId: 'ticket-1',
        blockedById: 'ticket-2',
      });
      depsRepo.save.mockResolvedValue({
        id: 'dep-1',
        ticketId: 'ticket-1',
        blockedById: 'ticket-2',
      });

      const result = await service.addDependency('ticket-1', 'ticket-2');
      expect(result.id).toBe('dep-1');
    });
  });

  describe('exportToCsv', () => {
    it('should return csv string with headers', async () => {
      ticketRepo.find.mockResolvedValue([
        {
          id: 'ticket-1',
          title: 'Fix bug',
          description: 'A bug',
          status: TicketStatus.TODO,
          priority: TicketPriority.HIGH,
          type: TicketType.BUG,
          projectId: 'proj-1',
          assigneeId: 'user-1',
        },
      ]);

      const result = await service.exportToCsv('proj-1');
      expect(result).toContain('title');
      expect(result).toContain('Fix bug');
    });
  });

  describe('importFromCsv', () => {
    it('should create tickets from valid CSV', async () => {
      const csv = `title,description,status,priority,type,assigneeId
Fix bug,A bug,TODO,HIGH,BUG,`;

      ticketRepo.create.mockReturnValue({});
      ticketRepo.save.mockResolvedValue({ id: 'ticket-1', title: 'Fix bug' });
      userRepo.find.mockResolvedValue([]);

      const result = await service.importFromCsv('proj-1', Buffer.from(csv));
      expect(result.created).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle invalid CSV gracefully', async () => {
      const result = await service.importFromCsv('proj-1', Buffer.from(''));
      expect(result.created).toBe(0);
    });
  });
});
