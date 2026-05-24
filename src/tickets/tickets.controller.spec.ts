import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

const VALID_TICKET_BODY = {
  title: 'Fix login bug',
  status: 'TODO',
  priority: 'MEDIUM',
  type: 'BUG',
  projectId: VALID_UUID,
};

describe('TicketsController – input validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            exportToCsv: jest.fn(),
            importFromCsv: jest.fn(),
            findDeleted: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            addDependency: jest.fn(),
            getDependencies: jest.fn(),
            removeDependency: jest.fn(),
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

  describe('POST /tickets', () => {
    it('returns 400 when body is empty', () =>
      request(app.getHttpServer()).post('/tickets').send({}).expect(400));

    it('returns 400 when title is missing', () =>
      request(app.getHttpServer())
        .post('/tickets')
        .send({ status: 'TODO', priority: 'MEDIUM', type: 'BUG', projectId: VALID_UUID })
        .expect(400));

    it('returns 400 when status is an invalid enum value', () =>
      request(app.getHttpServer())
        .post('/tickets')
        .send({ ...VALID_TICKET_BODY, status: 'INVALID' })
        .expect(400));

    it('returns 400 when priority is an invalid enum value', () =>
      request(app.getHttpServer())
        .post('/tickets')
        .send({ ...VALID_TICKET_BODY, priority: 'SUPER_HIGH' })
        .expect(400));

    it('returns 400 when type is an invalid enum value', () =>
      request(app.getHttpServer())
        .post('/tickets')
        .send({ ...VALID_TICKET_BODY, type: 'QUESTION' })
        .expect(400));

    it('returns 400 when projectId is not a valid UUID', () =>
      request(app.getHttpServer())
        .post('/tickets')
        .send({ ...VALID_TICKET_BODY, projectId: 'not-a-uuid' })
        .expect(400));

    it('returns 400 when assigneeId is not a valid UUID', () =>
      request(app.getHttpServer())
        .post('/tickets')
        .send({ ...VALID_TICKET_BODY, assigneeId: 'not-a-uuid' })
        .expect(400));

    it('returns 400 when unknown fields are sent', () =>
      request(app.getHttpServer())
        .post('/tickets')
        .send({ ...VALID_TICKET_BODY, injected: 'DROP TABLE' })
        .expect(400));
  });

  describe('GET /tickets', () => {
    it('returns 400 when projectId query param is not a valid UUID', () =>
      request(app.getHttpServer())
        .get('/tickets')
        .query({ projectId: 'not-a-uuid' })
        .expect(400));
  });

  describe('GET /tickets/export', () => {
    it('returns 400 when projectId query param is not a valid UUID', () =>
      request(app.getHttpServer())
        .get('/tickets/export')
        .query({ projectId: 'not-a-uuid' })
        .expect(400));
  });

  describe('GET /tickets/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer()).get('/tickets/not-a-uuid').expect(400));
  });

  describe('PATCH /tickets/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer())
        .patch('/tickets/not-a-uuid')
        .send({ title: 'Updated' })
        .expect(400));
  });

  describe('DELETE /tickets/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer()).delete('/tickets/not-a-uuid').expect(400));
  });

  describe('GET /tickets/:id/dependencies', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer())
        .get('/tickets/not-a-uuid/dependencies')
        .expect(400));
  });

  describe('POST /tickets/:id/dependencies', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer())
        .post('/tickets/not-a-uuid/dependencies')
        .send({ blockedBy: VALID_UUID })
        .expect(400));
  });

  describe('DELETE /tickets/:id/dependencies/:blockerId', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer())
        .delete(`/tickets/not-a-uuid/dependencies/${VALID_UUID}`)
        .expect(400));

    it('returns 400 when blockerId is not a valid UUID', () =>
      request(app.getHttpServer())
        .delete(`/tickets/${VALID_UUID}/dependencies/not-a-uuid`)
        .expect(400));
  });
});
