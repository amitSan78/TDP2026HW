import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { TokenDenylistService } from './token-denylist.service';
import * as bcrypt from 'bcrypt';

const mockUsersService = () => ({
  findByUsername: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn().mockReturnValue('signed-token'),
});

describe('AuthService', () => {
  let service: AuthService;
  let usersService: ReturnType<typeof mockUsersService>;
  let denylistService: TokenDenylistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        TokenDenylistService,
        { provide: UsersService, useFactory: mockUsersService },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    denylistService = module.get<TokenDenylistService>(TokenDenylistService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('should return access_token on valid credentials', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      usersService.findByUsername.mockResolvedValue({
        id: 'uuid-1',
        username: 'alice',
        role: 'DEVELOPER',
        password: hashed,
      });

      const result = await service.login('alice', 'secret123');
      expect(result.accessToken).toBe('signed-token');
    });

    it('should throw UnauthorizedException on wrong password', async () => {
      const hashed = await bcrypt.hash('secret123', 10);
      usersService.findByUsername.mockResolvedValue({
        id: 'uuid-1',
        username: 'alice',
        password: hashed,
      });

      await expect(service.login('alice', 'wrongpassword')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByUsername.mockRejectedValue(new Error('not found'));
      await expect(service.login('nobody', 'secret123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke the token', () => {
      service.logout('my-token');
      expect(denylistService.isRevoked('my-token')).toBe(true);
    });

    it('should not revoke a different token', () => {
      service.logout('my-token');
      expect(denylistService.isRevoked('other-token')).toBe(false);
    });
  });
});
