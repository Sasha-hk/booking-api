import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProtectedRequest } from '../auth/interfaces/protected-request.interface';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/appointment.dto';

@Controller('appointment')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('')
  async createAppointment(
    @Req() req: ProtectedRequest,
    @Body() body: CreateAppointmentDto,
  ) {
    const newAppointment = await this.appointmentService.createAppointment(
      req.user.id,
      body,
    );

    return newAppointment;
  }

  @UseGuards(JwtAuthGuard)
  @Get('')
  async getAppointments(
    @Req() req: ProtectedRequest,
  ) {
    return await this.appointmentService.getAppointments(req.user.id);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('/:id/confirm')
  async confirmAppointment(
    @Req() req: ProtectedRequest,
    @Param('id') appointmentId: string,
  ) {
    return await this.appointmentService.confirm(req.user.id, appointmentId);
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Post('/:id/cancel')
  async cancelAppointment(
    @Req() req: ProtectedRequest,
    @Param('id') appointmentId: string,
  ) {
    return await this.appointmentService.cancel(req.user.id, appointmentId);
  }
}
