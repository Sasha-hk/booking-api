import * as mongoose from 'mongoose';

import { UserSchema } from './user.schema';

export const AppointmentSchema = new mongoose.Schema({
  date: Date,
  user: UserSchema,
  doctor: UserSchema,
  active: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });
