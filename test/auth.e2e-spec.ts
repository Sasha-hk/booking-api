import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { Application } from 'express';
import * as mongoose from 'mongoose';
import * as request from 'supertest';

import { AppModule } from '../src/app.module';
import { DoctorSchema } from '../src/schemas/doctor.schema';
import { SessionSchema } from '../src/schemas/session.schema';
import { UserSchema } from '../src/schemas/user.schema';
import getCookies from './utils/get-cookies';
import { sleep } from './utils/sleep';

interface Credentials {
  email: string
  name: string
  type: 'user' | 'doctor'
  password: string
  free?: boolean,
  specialization?: string,
  refreshToken?: string
  accessToken?: string
}

const registerUser = async (app: Application, credentials: Credentials) => {
  await request(app)
    .post('/auth/register')
    .send(credentials)
    .expect(201);

  const r = await request(app)
    .post('/auth/log-in')
    .send(credentials)
    .expect(200);

  const cookies = getCookies(r);

  const user: Record<string, any> = {};

  Object.assign(user, credentials);

  user.refreshToken = cookies.refreshToken.value;
  user.accessToken = r.body.accessToken;

  return user as Credentials;
};

describe('AuthController (e2e)', () => {
  let app: Application;
  let application: INestApplication;
  let User = mongoose.model('User', UserSchema);
  let Session = mongoose.model('Session', SessionSchema);
  let Doctor = mongoose.model('Doctor', DoctorSchema);

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
    await Doctor.deleteMany();
  });

  afterAll(() => {
    mongoose.connection.close();
  });

  describe('e2e', () => {
    const credentials: Credentials = {
      email: 'some.mail@gmail.com',
      name: 'john',
      type: 'user',
      password: 'qwerty',
    };

    test('register user', async () => {
      await request(app)
        .post('/auth/register')
        .send(credentials)
        .expect(201);

      const users = await User.find();

      expect(users).toHaveLength(1);
      expect(users[0].email).toBe(credentials.email);
      expect(users[0].name).toBe(credentials.name);
      expect(users[0].type).toBe(credentials.type);
      expect(users[0].password).toBeTruthy();

      const doctors = await Doctor.find();

      expect(doctors).toHaveLength(0);
    });

    test('log-in user', async () => {
      const r = await request(app)
        .post('/auth/log-in')
        .send(credentials)
        .expect(200);

      const cookie = getCookies(r);

      expect(r.body.accessToken).toBeTruthy();
      expect(cookie.refreshToken.value).toBeTruthy();

      credentials.accessToken = r.body.accessToken;
      credentials.refreshToken = cookie.refreshToken.value;

      const sessions = await Session.find();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].refreshToken).toBe(credentials.refreshToken);
      expect(sessions[0].user.email).toBe(credentials.email);
      expect(sessions[0].user.name).toBe(credentials.name);
      expect(sessions[0].user.type).toBe(credentials.type);
      expect(sessions[0].user.password).toBeTruthy();
    });

    test('refresh', async () => {
      await sleep(1000);

      const r = await request(app)
        .get('/auth/refresh')
        .set('Cookie', ['refreshToken=' + credentials.refreshToken])
        .expect(200);

      expect(r.body.accessToken).toBeTruthy();

      const sessions = await Session.find();

      expect(sessions).toHaveLength(1);
      expect(sessions[0].refreshToken).not.toBe(credentials.refreshToken);

      const cookie = getCookies(r);

      credentials.refreshToken = cookie.refreshToken.value;
      credentials.accessToken = r.body.accessToken;
    });

    test('log-out', async () => {
      await request(app)
        .get('/auth/log-out')
        .set('Cookie', ['refreshToken=' + credentials.refreshToken])
        .set({ Authorization: 'Bearer ' + credentials.accessToken })
        .expect(200);

      const sessions = await Session.find();

      expect(sessions).toHaveLength(0);
    });
  });

  describe('Register doctor', () => {
    let credentials: Credentials = {
      email: '12348@some.com',
      name: 'john',
      password: '123123123',
      type: 'doctor',
      free: true,
      specialization: 'therapist',
    };

    test('register', async () => {
      credentials = await registerUser(app, credentials);

      const doctors = await Doctor.find();

      expect(doctors).toHaveLength(1);

      const doctor = await User.findOne({ email: credentials.email });

      expect(doctor).toBeTruthy();

      expect(doctor.doctor).toBeTruthy();
      expect(doctor.doctor.free).toBe(credentials.free);
      expect(doctor.doctor.specialization).toBe(credentials.specialization);
    });
  });
});
