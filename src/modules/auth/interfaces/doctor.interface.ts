import { Document } from 'mongoose';

export interface Session extends Document {
  readonly free: Boolean,
  readonly specialization: string,
}
