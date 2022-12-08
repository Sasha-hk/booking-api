import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../shared/database/database.module';
import { doctorProviders } from './doctor.providers';
import { userProviders } from './user.providers';
import { UserService } from './user.service';

@Module({
  controllers: [],
  providers: [
    UserService,
    ...userProviders,
    ...doctorProviders,
  ],
  imports: [DatabaseModule],
  exports: [
    UserService,
    ...userProviders,
    ...doctorProviders,
  ],
})
export class UserModule {}
