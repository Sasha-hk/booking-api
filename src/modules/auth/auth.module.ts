import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { DatabaseModule } from '../../shared/database/database.module';
import { UserModule } from '../user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokensService } from './jwt-tokens.service';
import { sessionProviders } from './providers/session.providers';
import { JwtStrategy } from './strategy/jwt-auth.strategy';
import { LocalStrategy } from './strategy/local-auth.strategy';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokensService,
    JwtService,
    JwtStrategy,
    LocalStrategy,
    ...sessionProviders,
  ],
  imports: [DatabaseModule, UserModule],
  exports: [
    AuthService,
    JwtTokensService,
    JwtService,
    JwtStrategy,
    LocalStrategy,
    ...sessionProviders,
  ],
})
export class AuthModule { }
