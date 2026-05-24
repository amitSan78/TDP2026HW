import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

describe('CommentsController – input validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [
        {
          provide: CommentsService,
          useValue: {
            create: jest.fn(),
            findAllForTicket: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            findMentionsForUser: jest.fn(),
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

  describe('POST /tickets/:ticketId/comments', () => {
    it('returns 400 when ticketId is not a valid UUID', () =>
      request(app.getHttpServer())
        .post('/tickets/not-a-uuid/comments')
        .send({ content: 'Hello', authorId: VALID_UUID })
        .expect(400));

    it('returns 400 when body is empty', () =>
      request(app.getHttpServer())
        .post(`/tickets/${VALID_UUID}/comments`)
        .send({})
        .expect(400));

    it('returns 400 when content is missing', () =>
      request(app.getHttpServer())
        .post(`/tickets/${VALID_UUID}/comments`)
        .send({ authorId: VALID_UUID })
        .expect(400));

    it('returns 400 when authorId is not a valid UUID', () =>
      request(app.getHttpServer())
        .post(`/tickets/${VALID_UUID}/comments`)
        .send({ content: 'Hello', authorId: 'not-a-uuid' })
        .expect(400));

    it('returns 400 when unknown fields are sent', () =>
      request(app.getHttpServer())
        .post(`/tickets/${VALID_UUID}/comments`)
        .send({ content: 'Hello', authorId: VALID_UUID, extra: 'field' })
        .expect(400));
  });

  describe('GET /tickets/:ticketId/comments', () => {
    it('returns 400 when ticketId is not a valid UUID', () =>
      request(app.getHttpServer())
        .get('/tickets/not-a-uuid/comments')
        .expect(400));
  });

  describe('PATCH /tickets/:ticketId/comments/:commentId', () => {
    it('returns 400 when ticketId is not a valid UUID', () =>
      request(app.getHttpServer())
        .patch(`/tickets/not-a-uuid/comments/${VALID_UUID}`)
        .send({ content: 'Updated' })
        .expect(400));

    it('returns 400 when commentId is not a valid UUID', () =>
      request(app.getHttpServer())
        .patch(`/tickets/${VALID_UUID}/comments/not-a-uuid`)
        .send({ content: 'Updated' })
        .expect(400));
  });

  describe('DELETE /tickets/:ticketId/comments/:commentId', () => {
    it('returns 400 when ticketId is not a valid UUID', () =>
      request(app.getHttpServer())
        .delete(`/tickets/not-a-uuid/comments/${VALID_UUID}`)
        .expect(400));

    it('returns 400 when commentId is not a valid UUID', () =>
      request(app.getHttpServer())
        .delete(`/tickets/${VALID_UUID}/comments/not-a-uuid`)
        .expect(400));
  });

  describe('GET /users/:userId/mentions', () => {
    it('returns 400 when userId is not a valid UUID', () =>
      request(app.getHttpServer())
        .get('/users/not-a-uuid/mentions')
        .expect(400));

    it('returns 400 when page query param is not a number', () =>
      request(app.getHttpServer())
        .get(`/users/${VALID_UUID}/mentions`)
        .query({ page: 'abc' })
        .expect(400));

    it('returns 400 when pageSize query param is not a number', () =>
      request(app.getHttpServer())
        .get(`/users/${VALID_UUID}/mentions`)
        .query({ pageSize: 'abc' })
        .expect(400));
  });
});
