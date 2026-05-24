import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

describe('UsersController – input validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
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

  describe('POST /users', () => {
    it('returns 400 when body is empty', () =>
      request(app.getHttpServer()).post('/users').send({}).expect(400));

    it('returns 400 when email is invalid', () =>
      request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'alice',
          email: 'not-an-email',
          fullName: 'Alice Smith',
          role: 'DEVELOPER',
          password: 'secret123',
        })
        .expect(400));

    it('returns 400 when role is not a valid enum value', () =>
      request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'alice',
          email: 'alice@test.com',
          fullName: 'Alice Smith',
          role: 'SUPERUSER',
          password: 'secret123',
        })
        .expect(400));

    it('returns 400 when password is shorter than 6 characters', () =>
      request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'alice',
          email: 'alice@test.com',
          fullName: 'Alice Smith',
          role: 'DEVELOPER',
          password: 'abc',
        })
        .expect(400));

    it('returns 400 when unknown fields are sent', () =>
      request(app.getHttpServer())
        .post('/users')
        .send({
          username: 'alice',
          email: 'alice@test.com',
          fullName: 'Alice Smith',
          role: 'DEVELOPER',
          password: 'secret123',
          isAdmin: true,
        })
        .expect(400));
  });

  describe('GET /users/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer()).get('/users/not-a-uuid').expect(400));
  });

  describe('POST /users/update/:userId', () => {
    it('returns 400 when userId is not a valid UUID', () =>
      request(app.getHttpServer())
        .post('/users/update/not-a-uuid')
        .send({ fullName: 'New Name' })
        .expect(400));
  });

  describe('DELETE /users/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer()).delete('/users/not-a-uuid').expect(400));
  });

  describe('GET /users/:id – valid UUID passes pipe', () => {
    it('does not return 400 for a valid UUID (pipe passes)', async () => {
      const res = await request(app.getHttpServer()).get(
        `/users/${VALID_UUID}`,
      );
      expect(res.status).not.toBe(400);
    });
  });
});
