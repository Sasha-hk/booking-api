import * as jwt from 'jsonwebtoken';

import { JwkTokenPayload, JwtTokensPair } from '../../../src/modules/auth/jwt-tokens.service';
import { SetEnvVariable } from '../../../src/shared/decorators/set-env-variable.decorator';

/**
 * JWT tokens service
 */
export class JwtMock {
  /**
   * Access token secret
   *
   * Takes from environment variables
   */
  @SetEnvVariable('JWT_ACCESS_SECRET', 'string', true)
  private readonly accessSecret: string;

  /**
   * Refresh token secret
   *
   * Takes from environment variables
   */
  @SetEnvVariable('JWT_REFRESH_SECRET', 'string', true)
  private readonly refreshSecret: string;

  /**
   * Constructor
   */
  constructor() { }

  /**
   * Generate access token
   *
   * @param payload JWT payload
   * @returns JWT
   */
  async generateAccessToken(payload: JwkTokenPayload) {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: '60s',
    });
  }

  /**
   * Generate refresh token
   *
   * @param payload JWT payload
   * @returns JWT
   */
  async generateRefreshToken(payload: JwkTokenPayload) {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: '30d',
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

  /**
   * Verify access token
   *
   * @param token JWT
   * @returns verified and decoded token
   */
  verifyAccessToken(token: string) {
    return jwt.verify(token, this.accessSecret, {
    });
  }

  /**
   * Verify refresh token
   *
   * @param token JWT
   * @returns verified and decoded token
   */
  verifyRefreshToken(token: string) {
    return jwt.verify(token, this.refreshSecret, {
    });
  }
}
