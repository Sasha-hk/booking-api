import { IsEnum, IsString, Matches, MaxLength, MinLength } from 'class-validator';

// eslint-disable-next-line max-len
const emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export class RegisterDto {
  @IsString()
  @MinLength(5)
  @MaxLength(256)
  @Matches(emailPattern)
  readonly email: string;

  @IsString()
  @MinLength(4)
  @MaxLength(15)
  readonly username: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  readonly password: string;

  @IsString()
  @IsEnum(['user', 'doctor'])
  readonly type: 'user' | 'doctor';
}

export class LogInDto {
  @IsString()
  @MinLength(5)
  @MaxLength(256)
  @Matches(emailPattern)
  readonly email?: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  readonly password: string;
}
