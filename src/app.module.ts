import { Module } from '@nestjs/common';
import { AppointmentModule } from './modules/appointment/appointment.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { DatabaseModule } from './shared/database/database.module';

@Module({
  imports: [
    AuthModule,
    AppointmentModule,
    UserModule,
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
