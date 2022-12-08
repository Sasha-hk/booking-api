import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @Get('doctor')
  async getMasters(
    @Query('specialization') specialization: string,
  ) {
    return await this.userService.getMasterBySpecialization(specialization);
  }
}
