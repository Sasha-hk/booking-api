import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { User } from './interfaces/user.interface';

@Injectable()
export class UserService {
  constructor(
    @Inject('USER_MODEL')
    private readonly userModel: Model<User>,
  ) { }

  async getMasterBySpecialization(specialization: string) {
    return await this.userModel.find({
      type: 'doctor',
      specialization,
    });
  }

  async getExistsUser(id: string) {
    const candidate = await this.userModel.findById(id);

    if (!candidate) {
      throw new BadRequestException('User does\'t exists');
    }

    return candidate;
  }
}
