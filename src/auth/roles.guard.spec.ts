import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../users/user.entity';

const mockReflector = () => ({
  getAllAndOverride: jest.fn(),
});

const mockExecutionContext = (userRole: string) => ({
  getHandler: jest.fn(),
  getClass: jest.fn(),
  switchToHttp: jest.fn().mockReturnValue({
    getRequest: jest.fn().mockReturnValue({
      user: { role: userRole },
    }),
  }),
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: ReturnType<typeof mockReflector>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        { provide: Reflector, useFactory: mockReflector },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => jest.clearAllMocks());

  it('should allow access when no roles required', () => {
    reflector.getAllAndOverride.mockReturnValue(null);
    const ctx = mockExecutionContext('DEVELOPER') as any;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should allow ADMIN to access ADMIN-only route', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = mockExecutionContext('ADMIN') as any;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('should throw ForbiddenException when DEVELOPER accesses ADMIN route', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const ctx = mockExecutionContext('DEVELOPER') as any;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});