import {
  Injectable, NotFoundException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket, TicketStatus } from './ticket.entity';
import { TicketDependency } from './ticket-dependency.entity';
import { User, UserRole } from '../users/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AuditService } from '../audit/audit.service';
import { stringify } from 'csv-stringify/sync';
import { parse } from 'csv-parse/sync';

const STATUS_ORDER = [
  TicketStatus.TODO,
  TicketStatus.IN_PROGRESS,
  TicketStatus.IN_REVIEW,
  TicketStatus.DONE,
];

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepo: Repository<Ticket>,
    @InjectRepository(TicketDependency)
    private readonly depsRepo: Repository<TicketDependency>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateTicketDto): Promise<Ticket> {
    let assigneeId: string | null = dto.assigneeId ?? null;
    const wasAutoAssigned = !dto.assigneeId;

    if (!assigneeId) {
      assigneeId = await this.autoAssign(dto.projectId);
    }

    const ticket = this.ticketsRepo.create({
      ...dto,
      assigneeId: assigneeId ?? undefined,
    });
    const saved = await this.ticketsRepo.save(ticket);

    await this.auditService.log({
      actor: dto.assigneeId || 'SYSTEM',
      action: 'CREATE_TICKET',
      entityType: 'ticket',
      entityId: saved.id,
      payload: { title: saved.title, projectId: saved.projectId },
    });

    if (wasAutoAssigned && assigneeId) {
      await this.auditService.log({
        actor: 'SYSTEM',
        action: 'AUTO_ASSIGN',
        entityType: 'ticket',
        entityId: saved.id,
        payload: { assigneeId },
      });
    }

    return saved;
  }

  private async autoAssign(projectId: string): Promise<string | null> {
    const developers = await this.usersRepo.find({
      where: { role: UserRole.DEVELOPER },
      order: { createdAt: 'ASC' },
    });

    if (developers.length === 0) return null;

    let minCount = Infinity;
    let selectedId: string | null = null;

    for (const dev of developers) {
      const count = await this.ticketsRepo.count({
        where: { projectId, assigneeId: dev.id },
      });
      if (count < minCount) {
        minCount = count;
        selectedId = dev.id;
      }
    }

    return selectedId;
  }

  async findAll(projectId: string): Promise<Ticket[]> {
    return this.ticketsRepo.find({ where: { projectId } });
  }

  async findOne(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  async update(id: string, dto: UpdateTicketDto): Promise<Ticket> {
    const ticket = await this.findOne(id);

    // Rule: cannot update a DONE ticket
    if (ticket.status === TicketStatus.DONE) {
      throw new BadRequestException('Cannot update a DONE ticket');
    }

    // Rule: cannot move to DONE if there are unresolved blockers
    if (dto.status === TicketStatus.DONE) {
      const blockers = await this.depsRepo.find({
        where: { ticketId: id },
        relations: { blockedBy: true },
      });
      const unresolved = blockers.filter(
        (b) => b.blockedBy.status !== TicketStatus.DONE,
      );
      if (unresolved.length > 0) {
        throw new BadRequestException(
          `Ticket has ${unresolved.length} unresolved blocker(s). Resolve them first.`,
        );
      }
    }

    // Rule: status can only move forward
    if (dto.status) {
      const currentIndex = STATUS_ORDER.indexOf(ticket.status);
      const newIndex = STATUS_ORDER.indexOf(dto.status);
      if (newIndex <= currentIndex) {
        throw new BadRequestException(
          `Status can only move forward. Current: ${ticket.status}`
        );
      }
    }

    // Rule: manual priority change resets isOverdue
    if (dto.priority) {
      ticket.isOverdue = false;
    }

    Object.keys(dto).forEach((key) => {
      if (dto[key] !== undefined) {
        ticket[key] = dto[key];
      }
    });

    try {
      const saved = await this.ticketsRepo.save(ticket);

      await this.auditService.log({
        actor: 'user',
        action: 'UPDATE_TICKET',
        entityType: 'ticket',
        entityId: saved.id,
        payload: dto as Record<string, any>,
      });

      return saved;
    } catch (err) {
      if (err.name === 'OptimisticLockVersionMismatchError') {
        throw new ConflictException(
          'Ticket was updated by someone else. Please refresh and try again.'
        );
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    const ticket = await this.findOne(id);
    await this.ticketsRepo.softRemove(ticket);
  }

  async findDeleted(projectId: string): Promise<Ticket[]> {
    return this.ticketsRepo
      .createQueryBuilder('ticket')
      .withDeleted()
      .where('ticket.projectId = :projectId', { projectId })
      .andWhere('ticket.deletedAt IS NOT NULL')
      .getMany();
  }

  async restore(id: string): Promise<Ticket> {
    const ticket = await this.ticketsRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    await this.ticketsRepo.restore(id);
    return this.findOne(id);
  }

 async addDependency(ticketId: string, blockedById: string): Promise<TicketDependency> {
  // First check — before any DB calls
  if (ticketId === blockedById) {
    throw new BadRequestException('A ticket cannot block itself');
  }

  // Then check both tickets exist
  const ticket = await this.findOne(ticketId);
  const blocker = await this.findOne(blockedById);

  if (ticket.projectId !== blocker.projectId) {
    throw new BadRequestException(
      'Both tickets must belong to the same project',
    );
  }

  const existing = await this.depsRepo.findOne({
    where: { ticketId, blockedById },
  });
  if (existing) {
    throw new BadRequestException('Dependency already exists');
  }

  const dep = this.depsRepo.create({ ticketId, blockedById });
  return this.depsRepo.save(dep);
}
  async getDependencies(ticketId: string): Promise<TicketDependency[]> {
    return this.depsRepo.find({
      where: { ticketId },
      relations: { blockedBy: true },
    });
  }

  async removeDependency(ticketId: string, blockedById: string): Promise<void> {
    const dep = await this.depsRepo.findOne({
      where: { ticketId, blockedById },
    });
    if (!dep) throw new NotFoundException('Dependency not found');
    await this.depsRepo.remove(dep);
  }
  async exportToCsv(projectId: string): Promise<string> {
  const tickets = await this.findAll(projectId);

  const rows = tickets.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? '',
    status: t.status,
    priority: t.priority,
    type: t.type,
    assigneeId: t.assigneeId ?? '',
  }));

  return stringify(rows, { header: true });
}

async importFromCsv(
  projectId: string,
  fileBuffer: Buffer,
): Promise<{ created: number; failed: number; errors: string[] }> {
  let records: any[];

  try {
    records = parse(fileBuffer, {
      columns: true,        // first row is header
      skip_empty_lines: true,
      trim: true,
    });
  } catch (err) {
    return { created: 0, failed: 0, errors: [`Invalid CSV format: ${err.message}`] };
  }

  let created = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    try {
      await this.create({
        title: row.title,
        description: row.description || undefined,
        status: row.status,
        priority: row.priority,
        type: row.type,
        projectId,
        assigneeId: row.assigneeId || undefined,
      });
      created++;
    } catch (err) {
      failed++;
      errors.push(`Row ${i + 2}: ${err.message}`);
    }
  }

  return { created, failed, errors };
}
}