import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController – input validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: { login: jest.fn(), logout: jest.fn() },
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

  describe('POST /auth/login', () => {
    it('returns 400 when body is empty', () =>
      request(app.getHttpServer()).post('/auth/login').send({}).expect(400));

    it('returns 400 when username is missing', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'secret123' })
        .expect(400));

    it('returns 400 when password is missing', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice' })
        .expect(400));

    it('returns 400 when password is shorter than 6 characters', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice', password: 'abc' })
        .expect(400));

    it('returns 400 when unknown fields are sent', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice', password: 'secret123', extra: true })
        .expect(400));
  });
});
