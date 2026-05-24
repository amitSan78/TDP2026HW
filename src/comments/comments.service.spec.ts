import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from './comment.entity';
import { CommentMention } from './comment-mention.entity';
import { User } from '../users/user.entity';

const mockCommentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockMentionRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
});

const mockUserRepo = () => ({
  createQueryBuilder: jest.fn(),
});

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepo: ReturnType<typeof mockCommentRepo>;
  let mentionRepo: ReturnType<typeof mockMentionRepo>;
  let userRepo: ReturnType<typeof mockUserRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: getRepositoryToken(Comment), useFactory: mockCommentRepo },
        {
          provide: getRepositoryToken(CommentMention),
          useFactory: mockMentionRepo,
        },
        { provide: getRepositoryToken(User), useFactory: mockUserRepo },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentRepo = module.get(getRepositoryToken(Comment));
    mentionRepo = module.get(getRepositoryToken(CommentMention));
    userRepo = module.get(getRepositoryToken(User));
  });

  afterEach(() => jest.clearAllMocks());

  describe('extractMentions (private via create)', () => {
    it('should parse @mentions from content', async () => {
      const dto = { content: 'Hello @alice and @BOB', authorId: 'user-1' };
      const saved = {
        id: 'comment-1',
        ...dto,
        ticketId: 'ticket-1',
        mentions: [],
      };

      commentRepo.create.mockReturnValue(saved);
      commentRepo.save.mockResolvedValue(saved);
      commentRepo.findOne.mockResolvedValue({ ...saved, mentions: [] });

      // Mock queryBuilder for user lookup
      const qb = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      userRepo.createQueryBuilder.mockReturnValue(qb);

      await service.create('ticket-1', dto);
      // alice and bob were looked up (case-insensitive)
      expect(userRepo.createQueryBuilder).toHaveBeenCalledTimes(2);
    });
  });

  describe('create', () => {
    it('should save comment and return with mentions', async () => {
      const dto = { content: 'Simple comment', authorId: 'user-1' };
      const saved = {
        id: 'comment-1',
        ...dto,
        ticketId: 'ticket-1',
        mentions: [],
      };

      commentRepo.create.mockReturnValue(saved);
      commentRepo.save.mockResolvedValue(saved);
      commentRepo.findOne.mockResolvedValue(saved);
      const qb = {
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      userRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.create('ticket-1', dto);
      expect(commentRepo.save).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('comment-1');
    });
  });

  describe('findOne', () => {
    it('should return comment when found', async () => {
      commentRepo.findOne.mockResolvedValue({
        id: 'comment-1',
        content: 'Hello',
      });
      const result = await service.findOne('comment-1');
      expect(result.content).toBe('Hello');
    });

    it('should throw NotFoundException when not found', async () => {
      commentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove comment when found', async () => {
      const comment = { id: 'comment-1', content: 'Hello', mentions: [] };
      commentRepo.findOne.mockResolvedValue(comment);
      commentRepo.remove.mockResolvedValue(comment);

      await expect(service.remove('comment-1')).resolves.not.toThrow();
      expect(commentRepo.remove).toHaveBeenCalledWith(comment);
    });

    // ← ADD THIS NEW TEST HERE
    it('should throw NotFoundException if comment not found', async () => {
      commentRepo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  }); // ← this closes describe('remove')
});
