import { Document } from 'mongoose';

import { User } from '../../auth/interfaces/user.interface';

export interface Session extends Document {
  readonly date: Date,
  readonly user: User,
  readonly doctor: User,
  readonly active: Boolean,
}
