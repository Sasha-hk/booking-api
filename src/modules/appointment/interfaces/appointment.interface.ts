import { Document } from 'mongoose';

import { User } from '../../user/interfaces/user.interface';

export interface Appointment extends Document {
  readonly date: Date,
  readonly user: User,
  readonly doctor: User,
  readonly active: Boolean,
}
