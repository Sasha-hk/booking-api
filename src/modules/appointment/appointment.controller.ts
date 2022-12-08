import { Body, Controller, Get, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ProtectedRequest } from '../auth/interfaces/protected-request.interface';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/appointment.dto';

@Controller('appointment')
export class AppointmentController {
  constructor(
    private readonly appointmentService: AppointmentService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('')
  async createAppointment(
    @Req() req: ProtectedRequest,
    @Res() res: Response,
    @Body() body: CreateAppointmentDto,
  ) {
    const newAppointment = await this.appointmentService.createAppointment(
      req.user.id,
      body,
    );

    res.status(HttpStatus.CREATED).json(newAppointment);
  }

  @UseGuards(JwtAuthGuard)
  @Get('')
  async getAppointments(
    @Req() req: ProtectedRequest,
  ) {
    return await this.appointmentService.getAppointments(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:id/confirm')
  async confirmAppointment(
    @Req() req: ProtectedRequest,
    @Param('id') appointmentId: string,
  ) {
    return await this.appointmentService.confirm(req.user.id, appointmentId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/:id/cancel')
  async cancelAppointment(
    @Req() req: ProtectedRequest,
    @Param('id') appointmentId: string,
  ) {
    return await this.appointmentService.cancel(req.user.id, appointmentId);
  }
}
