import * as mongoose from 'mongoose';

import { DoctorSchema } from './doctor.schema';
import { SessionSchema } from './session.schema';

export const UserSchema = new mongoose.Schema({
  email: String,
  photo_avatar: String,
  phone: String,
  password: String,
  name: String,
  type: String,
  doctor: {
    require: false,
    type: DoctorSchema,
  },
}, { timestamps: true });
