import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcryptjs from 'bcryptjs';
import { Model } from 'mongoose';

import { SetEnvVariable } from '../../shared/decorators/set-env-variable.decorator';
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

  async logIn(id: string) {
    const tokens = await this.jwtTokensService.generatePairTokens(
      { id: id },
    );

    const user = await this.userModel.findOne({
      id,
    });

    if (!user) {
      throw new BadRequestException('Bad access token');
    }

    await this.sessionModel.create({
      user: user,
      refreshToken: tokens.refreshToken,
    });

    return tokens;
  }

  async logOut(id: string, refreshToken: string) {
    const candidate = await this.sessionModel.findOne({
      userId: id,
      refreshToken,
    });

    if (candidate) {
      await this.sessionModel.deleteOne({
        _id: candidate._id,
      });
    }
  }

  async refresh(refreshToken: string) {
    let validToken: any;

    try {
      validToken = this.jwtTokensService.verifyRefreshToken(refreshToken);
    } catch (e: any) {
      throw new UnauthorizedException('Bad refresh token');
    }

    const candidate = await this.sessionModel.findOne({
      refreshToken,
    });

    if (!candidate) {
      throw new BadRequestException('Refresh token not exists');
    }

    const tokens = await this.jwtTokensService.generatePairTokens(
      { id: validToken.id },
    );

    await this.sessionModel.findByIdAndUpdate(
      candidate.id, { refreshToken: tokens.refreshToken },
    );

    return tokens;
  }

  async validateUser(email: string, inputPassword: string) {
    const candidate = await this.userModel.findOne({
      email,
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
