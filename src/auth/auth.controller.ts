import {
  Controller, Post, Get, Body, Req,
  UnauthorizedException, HttpCode,
  UsePipes, ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse,
  ApiBearerAuth, ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { ExtractJwt } from 'passport-jwt';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  @ApiOperation({ summary: 'Log in and obtain a JWT access token' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'Login successful — returns accessToken, tokenType, and expiresIn' })
  @ApiResponse({ status: 400, description: 'Validation error — missing or invalid fields' })
  @ApiResponse({ status: 401, description: 'Invalid username or password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Invalidate the current JWT token' })
  @ApiResponse({ status: 200, description: 'Logged out — token is revoked and can no longer be used' })
  @ApiResponse({ status: 401, description: 'No Bearer token provided in Authorization header' })
  logout(@Req() req: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    if (!token) throw new UnauthorizedException('No token provided');
    this.authService.logout(token);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Return the profile of the currently authenticated user' })
  @ApiResponse({ status: 200, description: 'The authenticated user object (password excluded)' })
  @ApiResponse({ status: 401, description: 'Missing or expired Bearer token' })
  getMe(@Req() req: any) {
    const { password, ...user } = req.user;
    return user;
  }
}
