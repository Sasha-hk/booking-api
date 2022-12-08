import * as mongoose from 'mongoose';

import { DoctorSchema } from './doctor.schema';
import { UserSchema } from './user.schema';

export const AppointmentSchema = new mongoose.Schema({
  date: Date,
  user: UserSchema,
  doctor: DoctorSchema,
  active: Boolean,
});
