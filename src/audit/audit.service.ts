import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface CreateAuditLogDto {
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  payload?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    const entry = this.auditRepo.create(dto);
    await this.auditRepo.save(entry);
  }

  async findAll(filters: {
    actor?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
  }): Promise<AuditLog[]> {
    const query = this.auditRepo.createQueryBuilder('log');

    if (filters.actor) {
      query.andWhere('log.actor = :actor', { actor: filters.actor });
    }
    if (filters.action) {
      query.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters.entityType) {
      query.andWhere('log.entityType = :entityType', {
        entityType: filters.entityType,
      });
    }
    if (filters.entityId) {
      query.andWhere('log.entityId = :entityId', {
        entityId: filters.entityId,
      });
    }

    return query.orderBy('log.createdAt', 'DESC').getMany();
  }
}
