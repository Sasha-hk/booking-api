import { Document } from 'mongoose';

import { UserSchema } from '../../../schemas/user.schema';

export interface Session extends Document {
  readonly user: typeof UserSchema;
  readonly refreshToken: string;
}
