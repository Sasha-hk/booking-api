import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { Model } from 'mongoose';

import { SetEnvVariable } from '../shared/decorators/set-env-variable.decorator';
import { RegisterDto } from './dto/auth.dto';
import { Session } from './interfaces/session.interface';
import { User } from './interfaces/user.interface';
import { JwtTokensService } from './jwt-tokens.service';


@Injectable()
export class AuthService {
  /**
   * Slat for password hashing
   */
  @SetEnvVariable('PASSWORD_SALT', 'number')
  private readonly passwordSalt: string;

  constructor(
    private readonly jwtTokensService: JwtTokensService,
    @Inject('USER_MODEL')
    private readonly userModel: Model<User>,
    @Inject('SESSION_MODEL')
    private readonly sessionModel: Model<Session>,
  ) { }

  async register(data: RegisterDto) {
    const emailExists = await this.userModel.findOne({
      $or: [
        { email: data.email },
      ],
    });

    if (emailExists) {
      throw new BadRequestException('User with specified email already exists');
    }

    const hashedPassword = bcryptjs.hashSync(data.password, this.passwordSalt);

    await this.userModel.create({
      ...data,
      password: hashedPassword,
    });
  }

  async logIn(data: { id: string }) {
    const tokens = await this.jwtTokensService.generatePairTokens(
      { id: data.id },
    );

    await this.sessionModel.create({
      userId: data.id,
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  async logOut(id: string, refreshToken: string) {
    const candidate = await this.sessionModel.findOne({
      user: id,
      refreshToken,
    });

    if (candidate) {
      await this.sessionModel.deleteOne({
        _id: candidate._id,
      });
    }
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('No refresh token');
    }

    let validToken: any;

    try {
      validToken = this.jwtTokensService.verifyRefreshToken(refreshToken);
    } catch (e: any) {
      throw new UnauthorizedException('Bad refresh token');
    }

    const candidate = await this.sessionModel.findOne({
      user: validToken.id,
      refreshToken,
    });

    if (!candidate) {
      throw new BadRequestException('Refresh token not exists');
    }

    const tokens = await this.jwtTokensService.generatePairTokens(
      { id: validToken.id },
    );

    await this.sessionModel.findOneAndUpdate(
      { _id: candidate.id }, { refreshToken: tokens.refreshToken },
    );

    return tokens;
  }

  async validateUser(email: string, inputPassword: string) {
    const candidate = await this.userModel.findOne({
      email: email,
    });

    if (!candidate) {
      return 'User not exists';
    }

    if (!bcryptjs.compareSync(inputPassword, candidate.password)) {
      return 'Bad password';
    }

    return candidate;
  }
}
