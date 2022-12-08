import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { DatabaseModule } from '../shared/database/database.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtTokensService } from './jwt-tokens.service';
import { sessionProviders } from './session.providers';
import { userProviders } from './user.providers';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtTokensService,
    JwtService,
    ...userProviders,
    ...sessionProviders,
  ],
  imports: [DatabaseModule],
  exports: [AuthService],
})
export class AuthModule { }
