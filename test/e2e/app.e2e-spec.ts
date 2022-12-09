import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import { Application } from 'express';
import * as mongoose from 'mongoose';
import * as request from 'supertest';

import { AppModule } from '../../src/app.module';
import { AppointmentSchema } from '../../src/schemas/appointment.schema';
import { DoctorSchema } from '../../src/schemas/doctor.schema';
import { SessionSchema } from '../../src/schemas/session.schema';
import { UserSchema } from '../../src/schemas/user.schema';
import getCookies from '../utils/get-cookies';
import { JwtMock } from '../utils/mock/jwt.mock';
import { sleep } from '../utils/sleep';

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

const authRequest = async (
  {
    app,
    credentials,
    method,
    url,
    data,
  }: {
    app: Application,
    credentials: Credentials,
    method: 'get' | 'post' | 'patch' | 'delete',
    url: string,
    data?: any,
  }) => {
  return request(app)[method](url)
    .set('Cookie', ['refreshToken=' + credentials.refreshToken])
    .set({ Authorization: 'Bearer ' + credentials.accessToken })
    .send(data);
};

describe('AuthController (e2e)', () => {
  let app: Application;
  let application: INestApplication;
  let User = mongoose.model('User', UserSchema);
  let Session = mongoose.model('Session', SessionSchema);
  let Doctor = mongoose.model('Doctor', DoctorSchema);
  let Appointment = mongoose.model('Appointment', AppointmentSchema);
  let jwtMock = new JwtMock();

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
    await Appointment.deleteMany();
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

    test('register', async () => {
      let credentials: Credentials = {
        email: '12348@some.com',
        name: 'john',
        password: '123123123',
        type: 'doctor',
        free: true,
        specialization: 'therapist',
      };

      credentials = await registerUser(app, credentials);

      const doctors = await Doctor.find();

      expect(doctors).toHaveLength(1);

      const doctor = await User.findOne({ email: credentials.email });

      expect(doctor).toBeTruthy();

      expect(doctor.doctor).toBeTruthy();
      expect(doctor.doctor.free).toBe(credentials.free);
      expect(doctor.doctor.specialization).toBe(credentials.specialization);
    });

    describe('other cases', () => {
      test('with exists email', async () => {
        const { body } = await request(app)
          .post('/auth/register')
          .send(credentials)
          .expect(400);

        expect(body.message).toBe('User with specified email already exists');
      });

      test('register doctor without free and specialization fields', async () => {
        const { body } = await request(app)
          .post('/auth/register')
          .send({
            ...credentials,
            type: 'doctor',
            email: '12390213@i.com',
          })
          .expect(400);

        expect(body.message).toBe('Free and specialization is required to register doctor');
      });

      test('login with not exists email', async () => {
        const { body } = await request(app)
          .post('/auth/log-in')
          .send({
            ...credentials,
            email: 'mail@mail.com',
          })
          .expect(400);

        expect(body.message).toBe('User not exists');
      });

      test('login with bad password', async () => {
        const { body } = await request(app)
          .post('/auth/log-in')
          .send({
            ...credentials,
            password: '1238',
          })
          .expect(400);

        expect(body.message).toBe('Bad password');
      });

      test('try to refresh with bad token', async () => {
        const r = await request(app)
          .get('/auth/refresh')
          .set('Cookie', ['refreshToken=token.token.token'])
          .expect(401);

        expect(r.body.message).toBe('Bad refresh token');
      });

      test('try to refresh with not exists in database refresh token', async () => {
        const r = await request(app)
          .get('/auth/refresh')
          .set('Cookie', ['refreshToken=' + await jwtMock.generateRefreshToken({ id: 'id' })])
          .expect(400);

        expect(r.body.message).toBe('Refresh token not exists');
      });
    });
  });

  describe('Appointments', () => {
    let userCredentials: Credentials = {
      email: 'user.email@gmail.us',
      name: 'micheal',
      type: 'user',
      password: '123123123',
    };

    let secondUserCredentials: Credentials = {
      email: 'user.email2@gmail.us',
      name: 'micheal2',
      type: 'user',
      password: '123123123',
    };

    let doctorCredentials: Credentials = {
      email: 'doctor.me@gmail.uk',
      name: 'oleksandr',
      type: 'doctor',
      password: '123123123',
      free: true,
      specialization: 'therapist',
    };

    beforeAll(async () => {
      await User.deleteMany();
      await Session.deleteMany();
      await Doctor.deleteMany();
      await Appointment.deleteMany();
    });

    test('register user and doctor', async () => {
      userCredentials = await registerUser(app, userCredentials);
      secondUserCredentials = await registerUser(app, secondUserCredentials);
      doctorCredentials = await registerUser(app, doctorCredentials);

      const users = await User.find();

      expect(users).toHaveLength(3);
    });

    let appointmentId: string;

    let doctors: any;

    test('create appointment', async () => {
      const { body } = await request(app)
        .get('/user/doctor?specialization=' + doctorCredentials.specialization)
        .expect(200);

      doctors = body;

      const date = new Date();
      date.setDate(date.getDate() + 1);

      const newAppointment = await authRequest({
        app,
        credentials: userCredentials,
        method: 'post',
        url: '/appointment',
        data: {
          date: date.toISOString(),
          doctor: doctors[0]._id,
        },
      });

      expect(newAppointment.status).toBe(201);

      const appointments = await Appointment.find();

      appointmentId = appointments[0].id;

      const userCandidate = await User.findOne({ email: userCredentials.email });
      const doctorCandidate = await User.findOne({ email: doctorCredentials.email });

      expect(appointments).toHaveLength(1);
      // @ts-ignore
      expect(appointments[0].user._id).toStrictEqual(userCandidate._id);
      // @ts-ignore
      expect(appointments[0].doctor._id).toStrictEqual(doctorCandidate._id);
      expect(appointments[0].date).toStrictEqual(date);

      date.setDate(date.getDate() + 3);

      await authRequest({
        app,
        credentials: secondUserCredentials,
        method: 'post',
        url: '/appointment',
        data: {
          date: date.toISOString(),
          doctor: doctors[0]._id,
        },
      });
    });

    test('confirm appointment', async () => {
      const { statusCode } = await authRequest({
        app,
        credentials: doctorCredentials,
        method: 'post',
        url: `/appointment/${appointmentId}/confirm`,
      });

      expect(statusCode).toBe(200);

      const appointment = await Appointment.findById(appointmentId);

      expect(appointment.active).toBe(true);
    });

    test('cancel appointment', async () => {
      const { statusCode } = await authRequest({
        app,
        credentials: doctorCredentials,
        method: 'post',
        url: `/appointment/${appointmentId}/cancel`,
      });

      expect(statusCode).toBe(200);

      const appointment = await Appointment.findById(appointmentId);

      expect(appointment).toBeNull();
    });

    test('get user appointments', async () => {
      const r = await authRequest({
        app,
        credentials: secondUserCredentials,
        method: 'get',
        url: '/appointment',
      });
    });

    test('get user appointments', async () => {
      const r = await authRequest({
        app,
        credentials: secondUserCredentials,
        method: 'get',
        url: '/appointment',
      });

      expect(r.body.length).toBe(1);
    });

    test('get doctor appointments', async () => {
      const r = await authRequest({
        app,
        credentials: doctorCredentials,
        method: 'get',
        url: '/appointment',
      });

      expect(r.body.length).toBe(1);
    });

    describe('other cases', () => {
      test('exceed the limit of appointments', async () => {
        const date = new Date();
        date.setDate(date.getDate() + 1);

        for (let i = 0; i <= 3; i++) {
          await authRequest({
            app,
            credentials: userCredentials,
            method: 'post',
            url: '/appointment',
            data: {
              date: date.toISOString(),
              doctor: doctors[0]._id,
            },
          });
        }

        const r = await authRequest({
          app,
          credentials: userCredentials,
          method: 'post',
          url: '/appointment',
          data: {
            date: date.toISOString(),
            doctor: doctors[0]._id,
          },
        });

        expect(r.body.message).toBe('Available only 3 appointment daily');
        expect(r.status).toBe(400);
      });

      test('create appointment in the past', async () => {
        const date = new Date();
        date.setUTCDate(date.getUTCDate() - 2);

        const r = await authRequest({
          app,
          credentials: userCredentials,
          method: 'post',
          url: '/appointment',
          data: {
            date: date.toISOString(),
            doctor: doctors[0]._id,
          },
        });

        expect(r.body.message).toBe('Impossible to create appointment in the past');
        expect(r.status).toBe(400);
      });

      test('create appointment with not exists user', async () => {
        const date = new Date();
        date.setDate(date.getDate() + 2);

        const r = await authRequest({
          app,
          credentials: userCredentials,
          method: 'post',
          url: '/appointment',
          data: {
            date: date.toISOString(),
            doctor: '111111111111111111111111',
          },
        });

        expect(r.body.message).toBe('User does\'t exists');
        expect(r.status).toBe(400);
      });

      test('confirm appointment that not belongs to user', async () => {
        const appointments = await Appointment.find();

        const r1 = await authRequest({
          app,
          credentials: userCredentials,
          method: 'post',
          url: `/appointment/${appointments[0]._id}/confirm`,
        });

        const r2 = await authRequest({
          app,
          credentials: userCredentials,
          method: 'post',
          url: `/appointment/${appointments[0]._id}/cancel`,
        });

        expect(r1.body.message).toBe('User is not a doctor');
        expect(r1.status).toBe(400);
        expect(r2.body.message).toBe('User is not a doctor');
        expect(r2.status).toBe(400);
      });
    });

    test('create appointment with not a doctor', async () => {
      const user = await User.findOne({ email: secondUserCredentials.email });

      const r = await authRequest({
        app,
        credentials: userCredentials,
        method: 'post',
        url: '/appointment',
        data: {
          date: (new Date()).toISOString(),
          doctor: user._id,
        },
      });

      expect(r.body.message).toBe('User is not a doctor');
      expect(r.status).toBe(400);
    });

    let newUser: Credentials = {
      email: 'new_mail@some.com',
      name: 'newOne',
      type: 'doctor',
      password: '123123123',
      free: true,
      specialization: 'therapist',
    };

    test('cancel or confirm appointment that not belong to doctor', async () => {
      newUser = await registerUser(app, newUser);

      const appointments = await Appointment.find();

      const r = await authRequest({
        app,
        credentials: newUser,
        method: 'post',
        url: `/appointment/${appointments[0]._id}/confirm`,
      });

      expect(r.body.message).toBe('The appointment not belongs to the doctor');
      expect(r.status).toBe(400);
    });

    test('get not exists appointment', async () => {
      const r = await authRequest({
        app,
        credentials: newUser,
        method: 'post',
        url: '/appointment/111111111111111111111111/confirm',
      });
      expect(r.body.message).toBe('Appointment doesn\'t exists');
      expect(r.status).toBe(400);
    });

    test('try access protected route with bad token', async () => {
      const r = await authRequest({
        app,
        credentials: {
          ...userCredentials,
          accessToken: 'asdf',
        },
        method: 'get',
        url: '/appointment',
      });

      console.log(r.body);
    });
  });
});
