import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../shared/database/database.module';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { AppointmentController } from './appointment.controller';
import { appointmentProviders } from './appointment.providers';
import { AppointmentService } from './appointment.service';

@Module({
  controllers: [AppointmentController],
  providers: [
    AppointmentService,
    ...appointmentProviders,
  ],
  imports: [AuthModule, DatabaseModule, UserModule],
  exports: [
    AppointmentService,
    ...appointmentProviders,
  ],
})
export class AppointmentModule {}
