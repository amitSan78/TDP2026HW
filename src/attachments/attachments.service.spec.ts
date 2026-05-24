import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './attachment.entity';
import * as fs from 'fs';

const mockAttachmentRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
});

// Mock the fs module so we don't touch real files in tests
jest.mock('fs');

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let repo: ReturnType<typeof mockAttachmentRepo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        {
          provide: getRepositoryToken(Attachment),
          useFactory: mockAttachmentRepo,
        },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
    repo = module.get(getRepositoryToken(Attachment));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should save attachment metadata to DB', async () => {
      const file = {
        filename: 'test-123.png',
        originalname: 'test.png',
        mimetype: 'image/png',
        size: 1024,
        path: 'uploads/test-123.png',
      } as Express.Multer.File;

      const attachment = { id: 'att-1', ticketId: 'ticket-1', ...file };
      repo.create.mockReturnValue(attachment);
      repo.save.mockResolvedValue(attachment);

      const result = await service.create('ticket-1', file);
      expect(result.id).toBe('att-1');
      expect(repo.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('should return all attachments for a ticket', async () => {
      const attachments = [
        { id: 'att-1', ticketId: 'ticket-1' },
        { id: 'att-2', ticketId: 'ticket-1' },
      ];
      repo.find.mockResolvedValue(attachments);

      const result = await service.findAll('ticket-1');
      expect(result).toHaveLength(2);
      expect(repo.find).toHaveBeenCalledWith({ where: { ticketId: 'ticket-1' } });
    });
  });

  describe('remove', () => {
    it('should delete file from disk and remove from DB', async () => {
      const attachment = {
        id: 'att-1',
        path: 'uploads/test-123.png',
      };
      repo.findOne.mockResolvedValue(attachment);
      repo.remove.mockResolvedValue(attachment);
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);

      await expect(service.remove('att-1')).resolves.not.toThrow();
      expect(fs.unlinkSync).toHaveBeenCalledWith('uploads/test-123.png');
      expect(repo.remove).toHaveBeenCalledWith(attachment);
    });

    it('should throw NotFoundException if attachment not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});