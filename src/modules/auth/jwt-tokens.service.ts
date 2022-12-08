import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SetEnvVariable } from '../shared/decorators/set-env-variable.decorator';

/**
 * JWT token payload
 */
export interface JwkTokenPayload {
  id: string,
}

/**
 * JWT tokens pair structure
 */
export interface JwtTokensPair {
  accessToken: string,
  refreshToken: string,
}

/**
 * JWT tokens service
 */
@Injectable()
export class JwtTokensService {
  /**
   * Access token secret
   */
  @SetEnvVariable('JWT_ACCESS_SECRET', 'string', true)
  private readonly accessSecret: string;

  /**
   * Refresh token secret
   */
  @SetEnvVariable('JWT_REFRESH_SECRET', 'string', true)
  private readonly refreshSecret: string;

  /**
   * Access token expires in
   */
  @SetEnvVariable('JWT_ACCESS_EXPIRES_IN', 'string', true)
  private readonly accessExpiresIn: string;

  /**
   * Refresh token expires in
   */
  @SetEnvVariable('JWT_REFRESH_EXPIRES_IN', 'string', true)
  private readonly refreshExpiresIn: string;

  /**
   * Constructor
   *
   * @param jwtService JWT service
   */
  constructor(
    private readonly jwtService: JwtService,
  ) { }

  /**
   * Generate access token
   *
   * @param payload JWT payload
   * @returns JWT
   */
  async generateAccessToken(payload: JwkTokenPayload) {
    return this.jwtService.sign(payload, {
      secret: this.accessSecret,
      expiresIn: this.accessExpiresIn,
    });
  }

  /**
   * Generate refresh token
   *
   * @param payload JWT payload
   * @returns JWT
   */
  async generateRefreshToken(payload: JwkTokenPayload) {
    return this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn,
    });
  }

  /**
   * Generate tokens pair
   *
   * @param payload
   * @returns tokens pair
   */
  async generatePairTokens(payload: JwkTokenPayload): Promise<JwtTokensPair> {
    return {
      accessToken: await this.generateAccessToken(payload),
      refreshToken: await this.generateRefreshToken(payload),
    };
  }

  // /**
  //  * Verify access token
  //  *
  //  * @param token JWT
  //  * @returns verified and decoded token
  //  */
  // verifyAccessToken(token: string) {
  //   return this.jwtService.verify(token, {
  //     secret: this.accessSecret,
  //   });
  // }

  /**
   * Verify refresh token
   *
   * @param token JWT
   * @returns verified and decoded token
   */
  verifyRefreshToken(token: string) {
    return this.jwtService.verify(token, {
      secret: this.refreshSecret,
    });
  }
}
