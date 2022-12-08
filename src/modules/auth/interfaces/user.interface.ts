import { Document } from 'mongoose';

import { DoctorSchema } from '../../../schemas/doctor.schema';

export interface User extends Document {
  readonly email: string;
  readonly proto_avatar: string;
  readonly phone: string;
  readonly password: string,
  readonly name: string;
  readonly type: 'user' | 'doctor';
  readonly doctor?: typeof DoctorSchema;
}
