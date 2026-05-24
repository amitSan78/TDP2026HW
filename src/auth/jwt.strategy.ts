import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { TokenDenylistService } from './token-denylist.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private denylistService: TokenDenylistService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecretkey',
      passReqToCallback: true,
    });
  }

  async validate(req: any, payload: any) {
  const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
  if (token && this.denylistService.isRevoked(token)) {
    throw new UnauthorizedException('Token has been revoked');
  }
  return this.usersService.findOne(payload.sub);
}
}