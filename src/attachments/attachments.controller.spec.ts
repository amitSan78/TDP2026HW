import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

describe('AttachmentsController – input validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentsController],
      providers: [
        {
          provide: AttachmentsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();
  });

  afterAll(() => app.close());

  describe('POST /tickets/:ticketId/attachments', () => {
    it('returns 400 when ticketId is not a valid UUID', () =>
      request(app.getHttpServer())
        .post('/tickets/not-a-uuid/attachments')
        .expect(400));

    it('returns 400 when no file is uploaded', () =>
      request(app.getHttpServer())
        .post(`/tickets/${VALID_UUID}/attachments`)
        .expect(400));

    it('returns 400 when file type is not allowed', () =>
      request(app.getHttpServer())
        .post(`/tickets/${VALID_UUID}/attachments`)
        .attach('file', Buffer.from('content'), {
          filename: 'malware.exe',
          contentType: 'application/x-executable',
        })
        .expect(400));
  });

  describe('GET /tickets/:ticketId/attachments', () => {
    it('returns 400 when ticketId is not a valid UUID', () =>
      request(app.getHttpServer())
        .get('/tickets/not-a-uuid/attachments')
        .expect(400));
  });

  describe('DELETE /tickets/:ticketId/attachments/:id', () => {
    it('returns 400 when ticketId is not a valid UUID', () =>
      request(app.getHttpServer())
        .delete(`/tickets/not-a-uuid/attachments/${VALID_UUID}`)
        .expect(400));

    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer())
        .delete(`/tickets/${VALID_UUID}/attachments/not-a-uuid`)
        .expect(400));
  });
});
