import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

const VALID_UUID = '00000000-0000-0000-0000-000000000001';

describe('ProjectsController – input validation', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectsController],
      providers: [
        {
          provide: ProjectsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            restore: jest.fn(),
            findDeleted: jest.fn(),
            getWorkload: jest.fn(),
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

  describe('POST /projects', () => {
    it('returns 400 when body is empty', () =>
      request(app.getHttpServer()).post('/projects').send({}).expect(400));

    it('returns 400 when name is missing', () =>
      request(app.getHttpServer())
        .post('/projects')
        .send({ ownerId: VALID_UUID })
        .expect(400));

    it('returns 400 when ownerId is not a valid UUID', () =>
      request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Project X', ownerId: 'not-a-uuid' })
        .expect(400));

    it('returns 400 when unknown fields are sent', () =>
      request(app.getHttpServer())
        .post('/projects')
        .send({ name: 'Project X', ownerId: VALID_UUID, secret: 'data' })
        .expect(400));
  });

  describe('GET /projects/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer()).get('/projects/not-a-uuid').expect(400));
  });

  describe('PATCH /projects/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer())
        .patch('/projects/not-a-uuid')
        .send({ name: 'New Name' })
        .expect(400));
  });

  describe('DELETE /projects/:id', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer()).delete('/projects/not-a-uuid').expect(400));
  });

  describe('GET /projects/:id/workload', () => {
    it('returns 400 when id is not a valid UUID', () =>
      request(app.getHttpServer())
        .get('/projects/not-a-uuid/workload')
        .expect(400));
  });
});
