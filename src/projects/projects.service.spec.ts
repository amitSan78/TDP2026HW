import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';

const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  softRemove: jest.fn(),
  restore: jest.fn(),
  createQueryBuilder: jest.fn(),
  manager: {
    query: jest.fn(),
  },
});

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useFactory: mockRepository },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    repo = module.get(getRepositoryToken(Project));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create and return a project', async () => {
      const dto = { name: 'My Project', ownerId: 'uuid-1' };
      repo.create.mockReturnValue(dto);
      repo.save.mockResolvedValue({ id: 'proj-1', ...dto });

      const result = await service.create(dto);
      expect(result.id).toBe('proj-1');
      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findOne', () => {
    it('should return project when found', async () => {
      repo.findOne.mockResolvedValue({ id: 'proj-1', name: 'My Project' });
      const result = await service.findOne('proj-1');
      expect(result.name).toBe('My Project');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update project fields', async () => {
      const project = { id: 'proj-1', name: 'Old Name' };
      repo.findOne.mockResolvedValue(project);
      repo.save.mockResolvedValue({ ...project, name: 'New Name' });

      const result = await service.update('proj-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });
  });

  describe('remove', () => {
    it('should soft remove project', async () => {
      const project = { id: 'proj-1', name: 'My Project' };
      repo.findOne.mockResolvedValue(project);
      repo.softRemove.mockResolvedValue(project);

      await expect(service.remove('proj-1')).resolves.not.toThrow();
      expect(repo.softRemove).toHaveBeenCalledWith(project);
    });

    it('should throw NotFoundException if project not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore a soft deleted project', async () => {
      const project = { id: 'proj-1', name: 'My Project', deletedAt: new Date() };
      repo.findOne
        .mockResolvedValueOnce(project)
        .mockResolvedValueOnce(project);
      repo.restore.mockResolvedValue(undefined);

      await service.restore('proj-1');
      expect(repo.restore).toHaveBeenCalledWith('proj-1');
    });
  });

  describe('getWorkload', () => {
    it('should return workload for all developers in project', async () => {
      const workload = [
        { userId: 'user-1', username: 'alice', openTicketCount: '2' },
        { userId: 'user-2', username: 'bob', openTicketCount: '5' },
      ];
      repo.manager.query.mockResolvedValue(workload);

      const result = await service.getWorkload('proj-1');
      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('alice');
      expect(repo.manager.query).toHaveBeenCalledTimes(1);
    });
  });
});