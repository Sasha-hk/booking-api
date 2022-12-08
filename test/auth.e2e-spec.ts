import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { Application } from 'express';
import * as mongoose from 'mongoose';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { SessionSchema } from '../src/schemas/session.schema';
import { UserSchema } from '../src/schemas/user.schema';

interface Credentials {
  email: string,
  name: string,
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
  let User = mongoose.model('User', UserSchema);
  let Session = mongoose.model('Session', SessionSchema);

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

    await mongoose.connect(process.env.MONGODB_URL);

    await User.deleteMany();
    await Session.deleteMany();
  });

  afterAll(() => {
    mongoose.connection.close();
  });

  describe('Register', () => {
    test('register user', async () => {
      const credentials = {
        email: 'some.mail@gmail.com',
        name: 'john',
        type: 'user',
        password: 'qwerty',
      } satisfies Credentials;

      await registerUser(app, credentials);

      const users = await User.find();

      console.log(users);
    });
  });
});
