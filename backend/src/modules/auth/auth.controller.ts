import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || '';

    const result = await this.authService.login(loginDto, ip, userAgent);

    // Emisión de cookie segura HttpOnly
    res.cookie('chifa_session', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días base, administrado por el ciclo de turno
      path: '/',
    });

    return result;
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req: any) {
    return {
      user: req.user,
      tenantId: req.tenantId,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('chifa_session', { path: '/' });
    return { message: 'Sesión finalizada exitosamente.' };
  }
}
