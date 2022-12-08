import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { Application } from 'express';
import { AppModule } from '../src/app.module';
import * as request from 'supertest';

interface Credentials {
  email: string,
  username: string,
  type: 'user' | 'doctor',
  password: string,
}

const registerUser = async (app: Application, credentials: Credentials) => {
  const r = await request(app)
    .post('/auth/register')
    .send(credentials)
    .expect(201);

  return r.body;
};

describe('AuthController (e2e)', () => {
  let app: Application;
  let application: INestApplication;

  beforeAll(async () => {
    // Init express application
    const module: TestingModule = await Test
      .createTestingModule({
        imports: [AppModule],
      })
      .compile();

    application = await module
      .createNestApplication()
      .use(cookieParser())
      .useGlobalPipes(new ValidationPipe({ transform: true }))
      .init();

    app = application.getHttpServer();
  });

  describe('Register', () => {
    test('register user', async () => {
      const credentials = {
        email: 'some.mail@gmail.com',
        username: 'john',
        type: 'user',
        password: 'qwerty',
      } satisfies Credentials;

      const data = await registerUser(app, credentials);
    });
  });
});
