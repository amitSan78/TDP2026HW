import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';

const mockRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: ReturnType<typeof mockRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto = {
      username: 'alice',
      email: 'alice@test.com',
      fullName: 'Alice Smith',
      role: UserRole.DEVELOPER,
      password: 'secret123',
    };

    it('should hash password and save user', async () => {
      repo.findOne.mockResolvedValue(null);
      repo.create.mockReturnValue(dto);
      repo.save.mockResolvedValue({ id: 'uuid-1', ...dto });

      const result = await service.create(dto);

      expect(repo.save).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('uuid-1');
    });

    it('should throw ConflictException if username or email exists', async () => {
      repo.findOne.mockResolvedValue({ id: 'existing' });
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return user when found', async () => {
      repo.findOne.mockResolvedValue({ id: '1', username: 'alice' });
      const result = await service.findOne('1');
      expect(result.username).toBe('alice');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update only allowed fields', async () => {
      const user = { id: '1', fullName: 'Old Name', role: UserRole.DEVELOPER };
      repo.findOne.mockResolvedValue(user);
      repo.save.mockResolvedValue({ ...user, fullName: 'New Name' });

      const result = await service.update('1', { fullName: 'New Name' });
      expect(result.fullName).toBe('New Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('bad-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove user when found', async () => {
      const user = { id: '1', username: 'alice' };
      repo.findOne.mockResolvedValue(user);
      repo.remove.mockResolvedValue(user);

      await expect(service.remove('1')).resolves.not.toThrow();
      expect(repo.remove).toHaveBeenCalledWith(user);
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
