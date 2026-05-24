---
name: nestjs-unit-testing
description: >
  Use this skill whenever writing unit tests for a NestJS application using Jest.
  Covers services, controllers, guards, and pipes. Always use this when the user
  asks to write tests, add a spec file, test a service method, or validate test
  coverage for any NestJS module. Applies to this IssueFlow TypeScript project.
---

# NestJS Unit Testing Skill

## Core Philosophy
Every module gets a `*.spec.ts` file **alongside** the file it tests.
Tests are written **at the same time** as the feature code, not after.
Each test must be:
- **Isolated** — no real DB, no real HTTP calls (use mocks)
- **Readable** — test name describes the exact scenario
- **Fast** — all external dependencies are mocked

---

## File Structure Pattern

For every `foo.service.ts`, create `foo.service.spec.ts` in the same folder:

```
src/users/
├── user.entity.ts
├── users.service.ts
├── users.service.spec.ts    ← unit test lives here
├── users.controller.ts
└── users.controller.spec.ts ← separate spec for controller
```

---

## Standard Test File Template

Use this exact structure for every service spec:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FooService } from './foo.service';
import { Foo } from './foo.entity';

// Helper: creates a mock TypeORM repository
// We mock only the methods we actually use
const mockRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  update: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('FooService', () => {
  let service: FooService;
  let repo: MockRepository<Foo>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FooService,
        {
          // Replace the real TypeORM repository with our mock
          provide: getRepositoryToken(Foo),
          useFactory: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FooService>(FooService);
    repo = module.get<MockRepository<Foo>>(getRepositoryToken(Foo));
  });

  // Reset all mocks between tests so they don't bleed into each other
  afterEach(() => jest.clearAllMocks());

  describe('methodName', () => {
    it('should [expected behavior] when [condition]', async () => {
      // Arrange — set up inputs and mock return values
      // Act — call the method
      // Assert — verify the output and that mocks were called correctly
    });

    it('should throw NotFoundException when [entity] not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
```

---

## Mocking Patterns

### Mock a TypeORM repository method
```typescript
repo.findOne.mockResolvedValue({ id: '1', username: 'alice' });
```

### Mock to simulate "not found"
```typescript
repo.findOne.mockResolvedValue(null);
```

### Mock to simulate a DB save
```typescript
repo.create.mockReturnValue(dto);
repo.save.mockResolvedValue({ id: 'uuid-123', ...dto });
```

### Mock another injected service
```typescript
const mockAuditService = { log: jest.fn() };
// In providers array:
{ provide: AuditService, useValue: mockAuditService }
```

### Mock @nestjs/schedule or other modules
```typescript
// Just don't import ScheduleModule — it's not needed in unit tests
```

---

## What to Test Per Module

### Users Service
- `create()` — hashes password, saves user, throws on duplicate username/email
- `findOne()` — returns user, throws NotFoundException if missing
- `update()` — only updates allowed fields (fullName, role)
- `remove()` — deletes user, throws if not found

### Auth Service
- `login()` — returns JWT on valid credentials, throws UnauthorizedException on wrong password
- Token deny-list: `logout()` adds token, `isTokenRevoked()` returns true after logout

### Tickets Service
- `create()` — validates enums, auto-assigns when no assigneeId
- `update()` — blocks update on DONE ticket, enforces forward-only status transitions
- Status transition matrix: TODO→IN_PROGRESS ✅, IN_PROGRESS→TODO ❌

### Comments Service
- `create()` — parses @mentions, saves mention records
- `update()` — diffs old vs new mentions, adds new, removes deleted

---

## Validation Testing (DTOs + Pipes)

To test that class-validator decorators reject bad input:

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './dto/create-user.dto';

describe('CreateUserDto', () => {
  it('should fail if role is invalid', async () => {
    const dto = plainToInstance(CreateUserDto, {
      username: 'alice',
      email: 'alice@example.com',
      fullName: 'Alice',
      role: 'SUPERADMIN', // invalid
      password: 'secret',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('role');
  });

  it('should pass with valid data', async () => {
    const dto = plainToInstance(CreateUserDto, {
      username: 'alice',
      email: 'alice@example.com',
      fullName: 'Alice Smith',
      role: 'DEVELOPER',
      password: 'secret123',
    });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
```

---

## Status Transition Test Pattern

This pattern repeats for every status constraint test:

```typescript
const VALID_TRANSITIONS = [
  ['TODO', 'IN_PROGRESS'],
  ['IN_PROGRESS', 'IN_REVIEW'],
  ['IN_REVIEW', 'DONE'],
];

const INVALID_TRANSITIONS = [
  ['IN_PROGRESS', 'TODO'],
  ['IN_REVIEW', 'IN_PROGRESS'],
  ['DONE', 'IN_REVIEW'],
];

describe('status transitions', () => {
  it.each(VALID_TRANSITIONS)(
    'should allow %s → %s',
    async (from, to) => {
      repo.findOne.mockResolvedValue({ id: '1', status: from, version: 1 });
      repo.save.mockResolvedValue({ id: '1', status: to });
      await expect(service.update('1', { status: to })).resolves.not.toThrow();
    }
  );

  it.each(INVALID_TRANSITIONS)(
    'should reject %s → %s',
    async (from, to) => {
      repo.findOne.mockResolvedValue({ id: '1', status: from, version: 1 });
      await expect(service.update('1', { status: to })).rejects.toThrow(BadRequestException);
    }
  );
});
```

---

## Running Tests

```bash
# Run all unit tests
npm test

# Run tests for one file only
npm test -- users.service.spec.ts

# Run in watch mode (re-runs on save — use during development)
npm run test:watch

# Run with coverage report
npm run test:cov
```

---

## Key Rules

1. **Never import real DB modules** (`TypeOrmModule`) in unit test modules — always mock repositories
2. **Never use `setTimeout` or real async delays** — mock time-sensitive code
3. **One `describe` per method** — group assertions by the function being tested
4. **Test the unhappy path too** — not found, invalid input, constraint violations
5. **Check mock call args** — use `expect(repo.save).toHaveBeenCalledWith(...)` to verify data flowing through
