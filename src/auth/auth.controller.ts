import {
  Controller, Post, Get, Body, Req,
  UnauthorizedException, HttpCode,
  UsePipes, ValidationPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { ExtractJwt } from 'passport-jwt';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
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
    const { password, ...user } = req.user;
    return user;
  }
}