import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { User } from '../user/interfaces/user.interface';
import { UserService } from '../user/user.service';
import { CreateAppointmentDto } from './dto/appointment.dto';
import { Appointment } from './interfaces/appointment.interface';

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
    await this.getExistsAppointment(id);

    // Get exists doc
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

    if (currentDate < new Date(data.date)) {
      throw new BadRequestException('Impossible to create appointment in the past');
    }
  }

  async getAppointments(id: string) {
    const candidate = await this.userModel.findById(id);

    if (!candidate) {
      throw new BadRequestException('User does\'t exists');
    }

    if (candidate.type === 'user') {
      return await this.appointmentModel.find({
        user: candidate,
      });
    } else {
      return await this.appointmentModel.find({
        doctor: candidate,
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

    return await this.appointmentModel.findByIdAndUpdate(
      appointmentId,
      {
        active: false,
      },
    );
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
