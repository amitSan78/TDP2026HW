import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService } from './audit.service';
import { AuditLog } from './audit-log.entity';

const mockAuditRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  createQueryBuilder: jest.fn(),
});

describe('AuditService', () => {
  let service: AuditService;
  let repo: ReturnType<typeof mockAuditRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: getRepositoryToken(AuditLog),
          useFactory: mockAuditRepo,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    repo = module.get(getRepositoryToken(AuditLog));
  });

  afterEach(() => jest.clearAllMocks());

  describe('log', () => {
    it('should create and save an audit log entry', async () => {
      const dto = {
        actor: 'user-1',
        action: 'CREATE_TICKET',
        entityType: 'ticket',
        entityId: 'ticket-1',
        payload: { title: 'Fix bug' },
      };
      repo.create.mockReturnValue(dto);
      repo.save.mockResolvedValue(dto);

      await service.log(dto);
      expect(repo.create).toHaveBeenCalledWith(dto);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('should log SYSTEM actor for auto actions', async () => {
      const dto = {
        actor: 'SYSTEM',
        action: 'AUTO_ASSIGN',
        entityType: 'ticket',
        entityId: 'ticket-1',
      };
      repo.create.mockReturnValue(dto);
      repo.save.mockResolvedValue(dto);

      await service.log(dto);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ actor: 'SYSTEM' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all logs when no filters provided', async () => {
      const logs = [{ id: '1', action: 'CREATE_TICKET' }];
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(logs),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({});
      expect(result).toEqual(logs);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('should apply actor filter when provided', async () => {
      const qb = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.findAll({ actor: 'SYSTEM' });
      expect(qb.andWhere).toHaveBeenCalledWith('log.actor = :actor', {
        actor: 'SYSTEM',
      });
    });
  });
});
