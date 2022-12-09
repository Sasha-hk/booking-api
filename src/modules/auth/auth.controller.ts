import { Body, Controller, Get, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';

import { GetCookies } from '../../shared/decorators/get-cookies.decorator';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ProtectedRequest } from './interfaces/protected-request.interface';
import { JwtTokensPair } from './jwt-tokens.service';

function sendRefreshAndAccessTokens(
  res: Response,
  { refreshToken, accessToken }: JwtTokensPair,
) {
  res.cookie(
    'refreshToken',
    refreshToken,
    {
      maxAge: 30 * 24 * 60 * 1000,
      httpOnly: true,
      secure: true,
      sameSite: true,
    },
  );

  res.status(200).json({
    accessToken,
  });
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) { }

  @Post('register')
  async register(
    @Body() data: RegisterDto,
    @Res() res: Response,
  ) {
    await this.authService.register(data);

    res.sendStatus(HttpStatus.CREATED);
  }

  @UseGuards(LocalAuthGuard)
  @Post('log-in')
  async login(
    @Req() req: ProtectedRequest,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.logIn(req.user.id);

    sendRefreshAndAccessTokens(res, tokens);
  }

  @UseGuards(JwtAuthGuard)
  @Get('log-out')
  async logOut(
    @Req() req: ProtectedRequest,
    @Res() res: Response,
    @GetCookies('refreshToken') refreshToken: string | undefined,
  ) {
    await this.authService.logOut(req.user.id, refreshToken);

    res.clearCookie('refreshToken');

    res.sendStatus(200);
  }

  @Get('refresh')
  async refresh(
    @Res() res: Response,
    @GetCookies('refreshToken') refreshToken: string | undefined,
  ) {
    const tokens = await this.authService.refresh(refreshToken);

    sendRefreshAndAccessTokens(res, tokens);
  }
}
