import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { DatabaseModule } from '../shared/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt-auth.strategy';
import { JwtTokensService } from './jwt-tokens.service';
import { LocalStrategy } from './local-auth.strategy';
import { sessionProviders } from './session.providers';
import { userProviders } from './user.providers';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokensService,
    JwtService,
    JwtStrategy,
    LocalStrategy,
    ...userProviders,
    ...sessionProviders,
  ],
  imports: [DatabaseModule],
  exports: [
    AuthService,
    JwtTokensService,
    JwtService,
    JwtStrategy,
    LocalStrategy,
    ...userProviders,
    ...sessionProviders,
  ],
})
export class AuthModule { }
