import * as mongoose from 'mongoose';

import { UserSchema } from './user.schema';

export const SessionSchema = new mongoose.Schema({
  user: UserSchema,
  refreshToken: String,
});
