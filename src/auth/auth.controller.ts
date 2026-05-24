import {
  Controller, Post, Get, Body, Req,
  UnauthorizedException, HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { IsString, MinLength } from 'class-validator';
import { ExtractJwt } from 'passport-jwt';

class LoginDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Req() req: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) throw new UnauthorizedException('No token provided');
    this.authService.logout(token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  getMe(@Req() req: any) {
    // req.user is set by JwtStrategy.validate()
    const { password, ...user } = req.user;
    return user;
  }
}