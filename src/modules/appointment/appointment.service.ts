/* eslint-disable max-len */
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import * as schedule from 'node-schedule';
import * as path from 'path';
import * as fs from 'fs/promises';

import { User } from '../user/interfaces/user.interface';
import { UserService } from '../user/user.service';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { Appointment } from './interfaces/appointment.interface';

const notificationsFile = path.join(process.cwd(), 'notifications.log');

@Injectable()
export class AppointmentService {
  constructor(
    private readonly userService: UserService,
    @Inject('USER_MODEL')
    private readonly userModel: Model<User>,
    @Inject('APPOINTMENT_MODEL')
    private readonly appointmentModel: Model<Appointment>,
  ) { }

  async getExistsAppointment(id: string) {
    const candidate = await this.appointmentModel.findById(id);

    if (!candidate) {
      throw new BadRequestException('Appointment doesn\'t exists');
    }

    return candidate;
  }

  checkBelongsAppointmentToDoctor(appointment: Appointment, doctor: User) {
    if (appointment.doctor.id !== doctor.id) {
      throw new BadRequestException('The appointment not belongs to the doctor');
    }
  }

  async createAppointment(
    id: string,
    data: CreateAppointmentDto,
  ) {
    // Check if user exists
    const userCandidate = await this.userService.getExistsUser(id);

    // Get exists doctor
    const doctorCandidate = await this.userService.getExistsUser(data.doctor);

    if (doctorCandidate.type !== 'doctor') {
      throw new BadRequestException('User is not a doctor');
    }

    const appointmentsForTheDate = await this.appointmentModel.find({
      date: data.date,
    }).count();

    if (appointmentsForTheDate > 3) {
      throw new BadRequestException('Available only 3 appointment daily');
    }

    const currentDate = new Date();

    if (new Date(currentDate.toISOString()) > new Date(data.date)) {
      throw new BadRequestException('Impossible to create appointment in the past');
    }

    /* istanbul ignore else */
    if (process.env.NODE_ENV !== 'prod') {
      // Message one minute before the appointment
      const scheduleOneMinuteBefore = new Date(data.date);
      scheduleOneMinuteBefore.setMinutes(scheduleOneMinuteBefore.getMinutes() - 1);
      schedule.scheduleJob(scheduleOneMinuteBefore, () => {
        // @ts-ignore
        fs.appendFile(notificationsFile, `${new Date().toISOString()} | Привет ${userCandidate.name}! Напоминаем что вы записаны к ${doctorCandidate.doctor.specialization} завтра в ${new Date(data.date).toTimeString()}! \n`);
      });
    } else {
      const scheduleOneDayBefore = new Date(data.date);
      scheduleOneDayBefore.setDate(scheduleOneDayBefore.getDate() - 1);
      schedule.scheduleJob(scheduleOneDayBefore, () => {
        // @ts-ignore
        fs.appendFile(notificationsFile, `${new Date().toISOString()} | Привет ${userCandidate.name}! Напоминаем что вы записаны к ${doctorCandidate.doctor.specialization} завтра в ${data.date}! \n`);
      });

      const scheduleOneHourBefore = new Date(data.date);
      scheduleOneHourBefore.setHours(scheduleOneHourBefore.getHours() - 1);
      schedule.scheduleJob(scheduleOneHourBefore, () => {
        // @ts-ignore
        fs.appendFile(notificationsFile, `${new Date().toISOString()} | Привет ${userCandidate.name}! Вам через 2 часа к ${doctorCandidate.doctor.specialization} в ${data.date}! \n`);
      });
    }

    return await this.appointmentModel.create({
      date: data.date,
      user: userCandidate,
      doctor: doctorCandidate,
    });
  }

  async getAppointments(id: string) {
    const candidate = await this.userService.getExistsUser(id);

    const currentDate = new Date();

    if (candidate.type === 'user') {
      return await this.appointmentModel.find({
        date: {
          $gte: currentDate,
        },
        userId: candidate._id,
      });
    } else {
      return await this.appointmentModel.find({
        date: {
          $gte: currentDate,
        },
        doctorId: candidate._id,
      });
    }
  }

  async cancel(userId: string, appointmentId: string) {
    const candidate = await this.userService.getExistsUser(userId);

    if (candidate.type !== 'doctor') {
      throw new BadRequestException('User is not a doctor');
    }

    const appointmentCandidate = await this.getExistsAppointment(appointmentId);

    this.checkBelongsAppointmentToDoctor(
      appointmentCandidate,
      candidate,
    );

    return await this.appointmentModel.findByIdAndDelete(appointmentId);
  }

  async confirm(userId: string, appointmentId: string) {
    const candidate = await this.userService.getExistsUser(userId);

    if (candidate.type !== 'doctor') {
      throw new BadRequestException('User is not a doctor');
    }

    const appointmentCandidate = await this.getExistsAppointment(appointmentId);

    this.checkBelongsAppointmentToDoctor(
      appointmentCandidate,
      candidate,
    );

    return await this.appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        active: true,
      },
    );
  }
}
