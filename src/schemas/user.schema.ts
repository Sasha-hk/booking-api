import * as mongoose from 'mongoose';

import { DoctorSchema } from './doctor.schema';

export const UserSchema = new mongoose.Schema({
  email: String,
  photo_avatar: String,
  phone: String,
  password: String,
  name: String,
  type: ['user', 'doctor'],
  doctor: {
    require: false,
    type: DoctorSchema,
  },
});
