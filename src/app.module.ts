import { Module } from '@nestjs/common';

import { AppointmentModule } from './modules/appointment/appointment.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './shared/database/database.module';

@Module({
  imports: [
    AuthModule,
    AppointmentModule,
    DatabaseModule,
    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
