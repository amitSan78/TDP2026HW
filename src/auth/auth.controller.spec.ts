import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const mockAuthService = () => ({
  login: jest.fn(),
  logout: jest.fn(),
});

describe('AuthController', () => {
  let app: INestApplication;
  let authService: ReturnType<typeof mockAuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useFactory: mockAuthService },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    authService = module.get(AuthService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('returns 400 when body is empty', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({})
        .expect(400);
    });

    it('returns 400 when username is missing', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: 'secret123' })
        .expect(400);
    });

    it('returns 400 when password is missing', async () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice' })
        .expect(400);
    });

    it('returns 200 with valid credentials', async () => {
      authService.login.mockResolvedValue({ access_token: 'token-123' });
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'alice', password: 'secret123' })
        .expect(200)
        .expect({ access_token: 'token-123' });
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 200 when logged out', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', 'Bearer fake-token')
        .expect(200)
        .expect({ message: 'Logged out successfully' });
    });
  });
});