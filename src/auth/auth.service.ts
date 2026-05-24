import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { TokenDenylistService } from './token-denylist.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private denylistService: TokenDenylistService,
  ) {}

  async login(username: string, password: string) {
    let user: any;
    try {
      user = await this.usersService.findByUsername(username);
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Sign the JWT — sub is the user id, used later in JwtStrategy.validate()
    const payload = { sub: user.id, username: user.username, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      tokenType: 'Bearer',
      expiresIn: 86400,
    };
  }

  logout(token: string): void {
    this.denylistService.revoke(token);
  }
}
